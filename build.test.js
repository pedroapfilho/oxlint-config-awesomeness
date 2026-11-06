import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const root = import.meta.dirname;
let cwd;

// The scratch copy has no lockfile, so pnpm must not try to install before running the script.
const run = (...args) =>
  spawnSync("pnpm", args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, pnpm_config_verify_deps_before_run: "false" },
    timeout: 30_000,
  });

const generatedFiles = () =>
  readdirSync(join(cwd, "dist"))
    .toSorted()
    .map((filename) => [filename, readFileSync(join(cwd, "dist", filename))]);

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "oxlint-build-"));

  for (const filename of ["package.json", "tsconfig.json", "tsconfig.build.json", "src"]) {
    cpSync(join(root, filename), join(cwd, filename), { recursive: true });
  }

  symlinkSync(join(root, "node_modules"), join(cwd, "node_modules"));
  const result = run("build");
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
});

afterEach(() => {
  rmSync(cwd, { force: true, recursive: true });
});

describe("pnpm build", () => {
  it("removes retired output and preserves coverage and dependencies", () => {
    const expected = generatedFiles();
    mkdirSync(join(cwd, "dist", "nested"));
    writeFileSync(join(cwd, "dist", "nested", "retired.js"), "export {};\n");
    writeFileSync(join(cwd, "dist", "retired.d.ts"), "export {};\n");
    mkdirSync(join(cwd, "coverage"));
    writeFileSync(join(cwd, "coverage", "keep.txt"), "keep\n");

    const result = run("build");

    expect(result.status).toBe(0);
    expect(readdirSync(join(cwd, "dist")).toSorted()).toEqual(
      expected.map(([filename]) => filename),
    );
    expect(generatedFiles()).toEqual(expected);
    expect(readFileSync(join(cwd, "coverage", "keep.txt"), "utf8")).toBe("keep\n");
    expect(readFileSync(join(cwd, "node_modules", "typescript", "package.json"))).toEqual(
      readFileSync(join(root, "node_modules", "typescript", "package.json")),
    );
  });
});

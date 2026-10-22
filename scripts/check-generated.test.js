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
import { dirname, join, resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
let cwd;

const run = (...args) => spawnSync("pnpm", args, { cwd, encoding: "utf8", timeout: 30_000 });

const generatedFiles = () =>
  readdirSync(join(cwd, "dist"))
    .toSorted()
    .map((filename) => [filename, readFileSync(join(cwd, "dist", filename))]);

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "oxlint-generated-"));

  for (const filename of [
    "package.json",
    "tsconfig.json",
    "tsconfig.build.json",
    "src",
    "scripts/check-generated.mjs",
  ]) {
    const destination = join(cwd, filename);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(root, filename), destination, { recursive: true });
  }

  symlinkSync(join(root, "node_modules"), join(cwd, "node_modules"));
  const result = run("build");
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
});

afterEach(() => {
  rmSync(cwd, { force: true, recursive: true });
});

describe("generated output", () => {
  it("accepts the complete clean build", () => {
    const result = run("check:generated");
    expect(result.status).toBe(0);
  });

  it("checks nested generated files", { timeout: 30_000 }, () => {
    mkdirSync(join(cwd, "src", "nested"));
    writeFileSync(join(cwd, "src", "nested", "entry.ts"), "export const value = 1;\n");
    const build = run("build");
    expect(build.status).toBe(0);
    const fresh = run("check:generated");
    expect(fresh.status).toBe(0);

    writeFileSync(join(cwd, "dist", "nested", "entry.js"), "export const value = 2;\n");
    const stale = run("check:generated");
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain("dist/nested/entry.js is stale. Run pnpm build.");
  });

  it.each(["retired.js", "retired.d.ts", "nested/retired.js"])(
    "rejects surplus output at %s",
    (filename) => {
      mkdirSync(dirname(join(cwd, "dist", filename)), { recursive: true });
      writeFileSync(join(cwd, "dist", filename), "export {};\n");
      const result = run("check:generated");
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("dist file inventory is stale. Run pnpm build.");
    },
  );

  it("rejects missing output", () => {
    rmSync(join(cwd, "dist", "index.d.ts"));
    const result = run("check:generated");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("dist file inventory is stale. Run pnpm build.");
  });

  it("rejects stale bytes", () => {
    writeFileSync(join(cwd, "dist", "index.js"), "export default {};\n");
    const result = run("check:generated");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("dist/index.js is stale. Run pnpm build.");
  });

  it("build removes retired output and preserves coverage and dependencies", () => {
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

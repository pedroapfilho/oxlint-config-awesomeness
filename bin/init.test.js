import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const INIT = resolve(import.meta.dirname, "init.js");
const TEMPLATE = readFileSync(resolve(import.meta.dirname, "template.ts"), "utf8");

let cwd;

const run = (...args) => {
  const result = spawnSync(process.execPath, [INIT, ...args], {
    cwd,
    encoding: "utf8",
  });
  return { code: result.status, stderr: result.stderr, stdout: result.stdout };
};

const configPath = () => join(cwd, "oxlint.config.ts");

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "oxlint-init-"));
});

afterEach(() => {
  rmSync(cwd, { force: true, recursive: true });
});

describe("bin/init.js", () => {
  it("scaffolds the template verbatim", () => {
    const { code, stdout } = run("init");

    expect(code).toBe(0);
    expect(stdout).toContain("Created ");
    expect(readFileSync(configPath(), "utf8")).toBe(TEMPLATE);
  });

  it.each([[], ["--help"], ["-h"], ["--force"], ["init", "--help"]])(
    "prints usage and exits 0 for %j",
    (...args) => {
      const { code, stdout } = run(...args);

      expect(code).toBe(0);
      expect(stdout).toContain("Usage: npx oxlint-config-awesomeness init");
    },
  );

  it("refuses to overwrite an existing config", () => {
    writeFileSync(configPath(), "// mine\n");
    const { code, stderr } = run("init");

    expect(code).toBe(1);
    expect(stderr).toContain("already exists. Re-run with --force.");
    expect(readFileSync(configPath(), "utf8")).toBe("// mine\n");
  });

  it.each(["--force", "-f"])("overwrites an existing config with %s", (flag) => {
    writeFileSync(configPath(), "// mine\n");
    const { code } = run("init", flag);

    expect(code).toBe(0);
    expect(readFileSync(configPath(), "utf8")).toBe(TEMPLATE);
  });

  it("refuses to follow a dangling symlink at the target path", () => {
    symlinkSync(join(cwd, "outside.ts"), configPath());
    const { code, stderr } = run("init");

    expect(code).toBe(1);
    expect(stderr).toContain("already exists. Re-run with --force.");
    expect(() => readFileSync(join(cwd, "outside.ts"), "utf8")).toThrow();
  });

  it.each([
    { args: ["badcmd"], reason: "an unknown command" },
    { args: ["init", "extra"], reason: "a trailing positional" },
    { args: ["init", "--bogus"], reason: "an unrecognised flag" },
  ])("exits 1 with usage on $reason", ({ args }) => {
    const { code, stderr } = run(...args);

    expect(code).toBe(1);
    expect(stderr).toContain("Usage: npx oxlint-config-awesomeness init");
  });
});

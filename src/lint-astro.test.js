import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import packageJson from "oxlint-config-awesomeness/package.json" with { type: "json" };
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import shadcn from "./shadcn.ts";

const LINT_ASTRO = resolve(import.meta.dirname, "..", packageJson.bin["lint-astro"]);

const SETTINGS = {
  shadcn: { componentImports: ["^astro-awesomeness/(astro|layouts|components)(/|$)"] },
};

const CONFIG = `const config: { rules?: object; settings?: object } = ${JSON.stringify({ settings: SETTINGS })};

export default config;
`;

const PROBE = `---
import { Button } from "astro-awesomeness/components";
const color = Astro.props.color;
---
<Button class={\`bg-\${color}\`} />
<Button class="p-4 bg-pink-500 p-[13px] invalid-design-class" style={{ padding: 1 }} />
`;

let cwd;

const git = (...args) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });

  expect(result.stderr).toBe("");
  expect(result.status).toBe(0);
};

const track = (files) => {
  for (const [filename, source] of Object.entries({
    "oxlint.config.ts": CONFIG,
    ...files,
    "package.json": '{ "name": "blog", "type": "module" }\n',
  })) {
    const path = join(cwd, filename);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, source);
  }

  git("init", "--quiet");
  git("add", "--all");
};

const run = () => {
  const result = spawnSync(process.execPath, [LINT_ASTRO], {
    cwd,
    encoding: "utf8",
    timeout: 60_000,
  });

  expect(result.error).toBeUndefined();

  return { code: result.status, stderr: result.stderr, stdout: result.stdout };
};

const lint = () => {
  const { code, stderr, stdout } = run();

  expect(stderr).toBe("");

  return { code, stdout };
};

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "oxlint-astro-"));
});

afterEach(() => {
  rmSync(cwd, { force: true, recursive: true });
});

describe("lint-astro CLI", () => {
  it("passes a template that follows the design system", () => {
    track({ "src/pages/index.astro": '<div class="p-4" />\n' });

    expect(lint()).toEqual({ code: 0, stdout: "" });
  });

  it("reports every rule of the shadcn preset inside a template", () => {
    track({ "src/pages/index.astro": PROBE });
    const { code, stdout } = lint();

    expect(code).toBe(1);

    for (const ruleName of Object.keys(shadcn.rules)) {
      expect(stdout).toContain(ruleName);
    }

    expect(stdout).not.toContain("astro/verifiable-attributes");
  });

  it.each([
    { ruleName: "astro/verifiable-attributes", source: '<div style="color: red" />' },
    { ruleName: "shadcn/no-inline-styles", source: "<style>div { color: red; }</style>" },
    { ruleName: "astro/verifiable-attributes", source: '<div class:list={["p-4"]} />' },
  ])("rejects $source through $ruleName", ({ ruleName, source }) => {
    track({ "src/pages/index.astro": `${source}\n` });
    const { code, stdout } = lint();

    expect(code).toBe(1);
    expect(stdout).toContain(ruleName);
  });

  it("applies the repo's shadcn rules and carries none of its other rules", () => {
    track({
      "oxlint.config.ts": `export default ${JSON.stringify({ rules: { eqeqeq: "error", "shadcn/no-raw-colors": "off" } })};\n`,
      "src/pages/index.astro": '---\nconst same = 1 == 1;\n---\n<div class="bg-pink-500" />\n',
    });

    expect(lint()).toEqual({ code: 0, stdout: "" });
  });

  it("reads the component imports from the repo's settings", () => {
    track({ "oxlint.config.ts": "export default {};\n", "src/pages/index.astro": PROBE });

    expect(lint().stdout).not.toContain("shadcn/no-restyle");
  });

  it("refuses an oxlint.config.ts without a default export", () => {
    track({ "oxlint.config.ts": "export const config = {};\n" });
    const { code, stderr } = run();

    expect(code).toBe(1);
    expect(stderr).toContain("oxlint.config.ts must default-export the repo's oxlint config.");
  });

  it("skips a tracked template deleted from the working tree", () => {
    track({
      "src/pages/index.astro": '<div class="p-4" />\n',
      "src/pages/removed.astro": '<div style="color: red" />\n',
    });
    rmSync(join(cwd, "src/pages/removed.astro"));

    expect(lint()).toEqual({ code: 0, stdout: "" });
  });

  it("lints nothing in a repo that tracks no template", () => {
    track({ "src/broken.js": "const = ;\n" });

    expect(lint()).toEqual({ code: 0, stdout: "" });
  });
});

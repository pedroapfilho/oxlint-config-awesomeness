import { describe, expect, it } from "vitest";

import { generate } from "./readme.mjs";

const FENCE = "```";
const template = "export default {};\n";

const source = `
const QUIET = {
  // Bit masks are how the flags are stored.
  "no-bitwise": "off",
} as const;

const config = defineConfig({
  overrides: [
    // Tests print what they find.
    {
      files: ["**/*.test.*"],
      plugins: ["vitest"],
      rules: {
        // The reporter reads stdout.
        "no-console": "off",
        "no-alert": "off",
      },
    },
  ],
  rules: {
    // A heading for the source alone.

    // Warn while the fleet catches up.
    "awesomeness/rule-a": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    // The formatter owns declarations.
    "one-var": "off",
    ...QUIET,
  },
});
`;

const config = {
  categories: { correctness: "error" },
  jsPlugins: [{ name: "awesomeness", specifier: "file:///awesomeness.js" }],
  options: { typeAware: true },
  overrides: [
    {
      files: ["**/*.test.*"],
      plugins: ["vitest"],
      rules: { "no-alert": "off", "no-console": "off" },
    },
  ],
  plugins: ["typescript"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "awesomeness/rule-a": "warn",
    "no-bitwise": "off",
    "one-var": "off",
  },
};

const README = `# fixture

<!-- summary:start -->
<!-- summary:end -->

<!-- template:start -->
<!-- template:end -->

<!-- plugins:start -->

- **eslint**: Core
- **unicorn**: Left over from an older config

<!-- plugins:end -->

<!-- overrides:start -->
<!-- overrides:end -->

<!-- disabled:start -->
<!-- disabled:end -->

<!-- rules:start -->

## Core

Written by hand, above the sections.

### typescript/no-explicit-any

Disallow any.

${FENCE}ts
const value: any = 1;
${FENCE}

### no-console

Disallow console.

### @typescript-eslint/no-explicit-any

The same rule under its other name.

### awesomeness/rule-a

Rule A. Severity: \`error\`. An older reason.

<!-- rules:end -->
`;

const generated = generate({ config, readme: README, source, template });

describe("pnpm readme", () => {
  it("counts the rules enabled by name and the plugins", () => {
    expect(generated).toContain("**2 rules** enabled by name, across **4 plugins**.");
  });

  it("prints the template", () => {
    expect(generated).toContain(`${FENCE}ts\n${template}${FENCE}`);
  });

  it("lists the config's plugins and keeps the descriptions written for them", () => {
    expect(generated).toContain(
      "- **eslint**: Core\n- **typescript**:\n- **vitest**:\n- **awesomeness** (JS plugin):\n",
    );
    expect(generated).not.toContain("unicorn");
  });

  it("gives each override its reason and every rule it changes", () => {
    expect(generated).toContain(
      [
        "- `**/*.test.*`: Tests print what they find. Adds the `vitest` plugin.",
        "  - `no-console` is off: The reporter reads stdout.",
        "  - Also off: `no-alert`.",
      ].join("\n"),
    );
  });

  it("gives each rule that is off its reason, through a spread family too", () => {
    expect(generated).toContain(
      "- `no-bitwise`: Bit masks are how the flags are stored.\n- `one-var`: The formatter owns declarations.",
    );
  });

  it("keeps a section's description and example, and states the severity", () => {
    expect(generated).toContain(
      `### typescript/no-explicit-any\n\nDisallow any. Severity: \`error\`.\n\n${FENCE}ts\nconst value: any = 1;\n${FENCE}`,
    );
    expect(generated).toContain("## Core\n\nWritten by hand, above the sections.");
  });

  it("drops a second section for the same rule under another name", () => {
    expect(generated).not.toContain("The same rule under its other name.");
  });

  it("drops a section for a rule that does not run", () => {
    expect(generated).not.toContain("### no-console");
  });

  it("replaces a stale severity and reason with the config's", () => {
    expect(generated).toContain(
      "### awesomeness/rule-a\n\nRule A. Severity: `warn`. Warn while the fleet catches up.\n",
    );
  });

  it("adds a rule a category enables, linked to its documentation", () => {
    expect(generated).toContain(
      "### no-debugger\n\n[oxlint documentation](https://oxc.rs/docs/guide/usage/linter/rules/eslint/no-debugger.html). Severity: `error`.",
    );
  });

  it("adds a rule that only an override's plugin runs", () => {
    expect(generated).toMatch(/^### vitest\/\S+\n\n\[oxlint documentation\]/mv);
  });

  it("changes nothing when run on its own output", () => {
    expect(generate({ config, readme: generated, source, template })).toBe(generated);
  });

  it.each([
    {
      edit: { readme: README.replace("<!-- disabled:start -->", "") },
      failure: "README.md has no disabled region.",
      reason: "a README without one of its regions",
    },
    {
      edit: { source: source.replace("    // The formatter owns declarations.\n", "") },
      failure: "one-var is off with no reason comment above it in src/index.ts.",
      reason: "a rule turned off without a reason",
    },
    {
      edit: { source: source.replace("    // Tests print what they find.\n", "") },
      failure: "The **/*.test.* override has no reason comment above it in src/index.ts.",
      reason: "an override without a reason",
    },
  ])("rejects $reason", ({ edit, failure }) => {
    expect(() => generate({ config, readme: README, source, template, ...edit })).toThrow(failure);
  });
});

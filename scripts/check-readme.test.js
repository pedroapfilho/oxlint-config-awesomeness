import { describe, expect, it } from "vitest";

import { checkReadme } from "./check-readme.mjs";

const FENCE = "```";
const template = "export default {};\n";

const config = {
  categories: { correctness: "error" },
  jsPlugins: [{ name: "awesomeness", specifier: "file:///awesomeness.js" }],
  options: { typeAware: true },
  overrides: [{ files: ["**/*.test.*"], plugins: ["vitest"], rules: { "no-console": "off" } }],
  plugins: ["unicorn"],
  rules: { "awesomeness/rule-a": "warn", "no-bitwise": "error", "one-var": "off" },
};

const rule = (scope, value, category) => ({ category, scope, type_aware: false, value });

const rules = [
  rule("eslint", "no-bitwise", "restriction"),
  rule("eslint", "no-console", "restriction"),
  rule("eslint", "no-debugger", "correctness"),
  rule("eslint", "one-var", "style"),
  rule("unicorn", "no-null", "style"),
  rule("vitest", "valid-expect", "correctness"),
];

const README = `# fixture

**2 rules** enabled by name, across **4 plugins**.

## Usage

${FENCE}ts
${template}${FENCE}

## Plugins

| Plugin        | Description |
| ------------- | ----------- |
| eslint (core) | Core        |
| unicorn       | Idioms      |
| vitest        | Tests       |

Plus **awesomeness**.

## File-Type Overrides

| Files         | What changes            |
| ------------- | ----------------------- |
| \`**/*.test.*\` | \`no-console\` is allowed |

## Disabled by Intent

| Category  | Rules off   |
| --------- | ----------- |
| **Style** | \`one-var\` |

## All Rules

### no-bitwise

Disallow bitwise operators.

### awesomeness/rule-a

Rule A. Severity: \`warn\`.
`;

const failuresFor = (readme) => checkReadme({ config, readme, rules, template });

describe("check:readme", () => {
  it("accepts a README that matches its config", () => {
    expect(failuresFor(README)).toEqual([]);
  });

  it.each([
    {
      edit: (readme) => `${readme}\n### unicorn/no-null\n\nDisallow null.\n`,
      failure: "README documents unicorn/no-null, which this config does not run.",
      reason: "a section for a rule that does not run",
    },
    {
      edit: (readme) => readme.replace("**2 rules**", "**3 rules**"),
      failure: "README headline should read **2 rules** enabled by name, across **4 plugins**.",
      reason: "a stale rule count",
    },
    {
      edit: (readme) => readme.replace("| **Style** | `one-var` |", "| **Style** | none |"),
      failure: "one-var is off but missing from README Disabled by Intent.",
      reason: "a disabled rule with no reason",
    },
    {
      edit: (readme) => readme.replace("Rule A. Severity: `warn`.", "Rule A."),
      failure: "awesomeness/rule-a warns, but its README section does not say Severity: `warn`.",
      reason: "a warning documented without its severity",
    },
    {
      edit: (readme) => readme.replace("`no-console` is allowed", "`no-bitwise` is allowed"),
      failure: "README says the **/*.test.* override changes no-bitwise; it does not.",
      reason: "an override row naming a rule the override leaves alone",
    },
    {
      edit: (readme) => readme.replace("| unicorn       | Idioms      |\n", ""),
      failure: "README Plugins and the config disagree about unicorn.",
      reason: "a missing plugin row",
    },
    {
      edit: (readme) => readme.replace(template, "export default { extends: [] };\n"),
      failure: "README Usage no longer shows bin/template.ts verbatim.",
      reason: "a Usage snippet that differs from the template",
    },
  ])("rejects $reason", ({ edit, failure }) => {
    const readme = edit(README);
    expect(readme).not.toBe(README);
    expect(failuresFor(readme)).toContain(failure);
  });
});

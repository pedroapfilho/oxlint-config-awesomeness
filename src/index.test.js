import config from "oxlint-config-awesomeness";
import antiSlopPlugin from "oxlint-config-awesomeness/anti-slop";
import packageJson from "oxlint-config-awesomeness/package.json" with { type: "json" };
import { describe, expect, it } from "vitest";

import sourceConfig from "./index.ts";

const findOverride = (glob) => {
  const override = config.overrides.find((entry) => entry.files.includes(glob));
  expect(override, `no override declares ${glob}`).toBeDefined();

  return override;
};

const antiSlopRulesIn = (override) =>
  Object.keys(override.rules)
    .filter((rule) => rule.startsWith("anti-slop/"))
    .toSorted();

const runForbiddenIdentifier = (parent) => {
  const reports = [];
  const identifier = { name: "shape", parent, type: "Identifier" };

  if (parent !== null) {
    parent.property = identifier;
  }

  const visitors = antiSlopPlugin.rules["no-shape-in-symbol-names"].create({
    report: (report) => reports.push(report),
  });

  const runIdentifier = visitors.Identifier;
  runIdentifier(identifier);

  return reports;
};

describe("oxlint-config-awesomeness", () => {
  it("exports a non-null object", () => {
    expect(config).not.toBeNull();
    expect(typeof config).toBe("object");
  });

  it("matches the TypeScript source at runtime", () => {
    expect(config).toEqual(sourceConfig);
  });

  it("registers the vendored anti-slop plugin and all 18 of its rules", async () => {
    expect(config.jsPlugins).toContainEqual({
      name: "anti-slop",
      specifier: import.meta.resolve("oxlint-config-awesomeness/anti-slop"),
    });

    const { default: plugin } = await import("oxlint-config-awesomeness/anti-slop");
    const ruleNames = Object.keys(plugin.rules).toSorted();
    expect(ruleNames).toHaveLength(18);

    for (const ruleName of ruleNames) {
      expect(config.rules).toHaveProperty(`anti-slop/${ruleName}`);
    }
  });

  it("registers the first-party awesomeness plugin and its rules", async () => {
    expect(config.jsPlugins).toContainEqual({
      name: "awesomeness",
      specifier: import.meta.resolve("oxlint-config-awesomeness/awesomeness"),
    });

    const { default: plugin } = await import("oxlint-config-awesomeness/awesomeness");

    for (const ruleName of Object.keys(plugin.rules)) {
      expect(config.rules).toHaveProperty(`awesomeness/${ruleName}`);
    }
  });

  it("resolves each JS plugin from this package or from a peer dependency", () => {
    const packageRoot = new URL("../", import.meta.url).href;

    for (const { name, specifier } of config.jsPlugins) {
      const dependency = /.*\/node_modules\/(?<package>(?:@[^\/]+\/)?[^\/]+)\//v.exec(specifier)
        ?.groups.package;

      if (dependency === undefined) {
        expect(specifier.startsWith(packageRoot), `${name} resolves outside the package`).toBe(
          true,
        );
      } else {
        expect(packageJson.peerDependencies, `${name} plugin`).toHaveProperty([dependency]);
      }
    }
  });

  it("has the expected top-level keys", () => {
    // Any key change here is a breaking contract change for consumers.
    const keys = Object.keys(config).toSorted();
    expect(keys).toEqual(
      ["categories", "env", "jsPlugins", "options", "overrides", "plugins", "rules"].toSorted(),
    );
  });
});

describe("anti-slop assertion family", () => {
  const testOverride = findOverride("**/__tests__/**");
  const e2eOverride = findOverride("**/e2e/**/*.ts");

  const family = antiSlopRulesIn(testOverride).filter((rule) => rule in e2eOverride.rules);

  it("relaxes a non-empty family", () => {
    expect(family.length).toBeGreaterThan(0);
  });

  it("keeps the test and e2e overrides in agreement", () => {
    expect(antiSlopRulesIn(testOverride)).toEqual(antiSlopRulesIn(e2eOverride));
  });

  it.each(family)("%s is off in tests and e2e but enabled at the base", (rule) => {
    expect(testOverride.rules[rule]).toBe("off");
    expect(e2eOverride.rules[rule]).toBe("off");
    expect(["error", "warn"]).toContain(config.rules[rule]);
  });
});

describe("anti-slop/no-shape-in-symbol-names", () => {
  it("ignores a non-computed member property", () => {
    expect(
      runForbiddenIdentifier({
        computed: false,
        object: { name: "schema", type: "Identifier" },
        property: null,
        type: "MemberExpression",
      }),
    ).toHaveLength(0);
  });

  it("reports an owned identifier", () => {
    expect(runForbiddenIdentifier({ type: "VariableDeclarator" })).toHaveLength(1);
  });
});

describe("type-aware linting", () => {
  it("enables tsgolint rules and compiler diagnostics for consumers", () => {
    expect(config.options).toEqual({
      reportUnusedDisableDirectives: "warn",
      typeAware: true,
      typeCheck: true,
    });
  });

  it("silences type-dependent rules on JavaScript, where every type is `any`", () => {
    const jsOverride = findOverride("**/*.js");
    expect(jsOverride.rules["@typescript-eslint/no-unsafe-call"]).toBe("off");
    expect(jsOverride.rules["@typescript-eslint/strict-boolean-expressions"]).toBe("off");
  });
});

describe("file-scoped overrides", () => {
  it("exempts nested monorepo script folders, not just the root one", () => {
    const cliOverride = findOverride("**/scripts/**");
    expect(cliOverride.rules["no-console"]).toBe("off");
    expect(cliOverride.files).not.toContain("scripts/**");
  });

  it("lets ambient declarations merge through interfaces", () => {
    const declarationOverride = findOverride("**/*.d.ts");
    expect(declarationOverride.rules["@typescript-eslint/consistent-type-definitions"]).toBe("off");
    expect(config.rules["@typescript-eslint/consistent-type-definitions"]).toEqual([
      "error",
      "type",
    ]);
  });

  it("keeps Next.js middleware matchers as plain string literals", () => {
    expect(findOverride("**/proxy.ts").rules["unicorn/prefer-string-raw"]).toBe("off");
  });

  it("allows the empty fixture pattern Playwright requires", () => {
    expect(findOverride("**/e2e/**/*.ts").rules["no-empty-pattern"]).toBe("off");
  });
});

describe("formatter agreement", () => {
  it("leaves hex digit casing to oxfmt", () => {
    expect(config.rules["unicorn/number-literal-case"]).toBe("off");
  });

  it("reports missing awaits once, through the type-aware rule", () => {
    expect(findOverride("**/*.ts").rules["require-await"]).toBe("off");
  });
});

describe("vitest in test files", () => {
  const testOverride = findOverride("**/*.test.*");

  it("leaves `.only` to no-only-tests, which also covers non-test files", () => {
    expect(testOverride.rules["vitest/no-focused-tests"]).toBe("off");
    expect(config.rules["no-only-tests/no-only-tests"]).toBe("error");
  });
});

describe("sequential awaits", () => {
  it("turns off both loop-await rules together", () => {
    expect(config.rules["no-await-in-loop"]).toBe("off");
    expect(config.rules["react-doctor/async-await-in-loop"]).toBe("off");
  });
});

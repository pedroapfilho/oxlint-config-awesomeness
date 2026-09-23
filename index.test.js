import config from "oxlint-config-awesomeness";
import antiSlopPlugin from "oxlint-config-awesomeness/anti-slop";
import awesomenessPlugin from "oxlint-config-awesomeness/awesomeness";
import { describe, expect, it } from "vitest";

import sourceConfig from "./src/index.ts";

const createLineComment = (value, line) => ({
  loc: {
    end: { column: value.length + 2, line },
    start: { column: 0, line },
  },
  type: "Line",
  value,
});

const createBlockComment = (value, startLine) => ({
  loc: {
    end: { column: 2, line: startLine + value.split("\n").length - 1 },
    start: { column: 0, line: startLine },
  },
  type: "Block",
  value,
});

const runNoNovelComments = (comments) => {
  const reports = [];
  const visitors = awesomenessPlugin.rules["no-novel-comments"].create({
    report: (report) => reports.push(report),
    sourceCode: { getAllComments: () => comments },
  });
  const runProgram = visitors.Program;

  runProgram();
  return reports;
};

const lineRun = (values, startLine = 1) =>
  values.map((value, index) => createLineComment(value, startLine + index));

const prose = (count, startLine = 1) =>
  lineRun(
    Array.from({ length: count }, (_, index) => ` prose ${index + 1}`),
    startLine,
  );

const plainBlock = (body) => `\n${body.map((line) => ` ${line}`).join("\n")}\n`;

const jsdocBlock = (body) => `*\n${body.map((line) => ` * ${line}`).join("\n")}\n `;

const APACHE_BODY = [
  "Copyright (c) 2026 Example",
  'Licensed under the Apache License, Version 2.0 (the "License");',
  "you may not use this file except in compliance with the License.",
  "You may obtain a copy of the License at",
  "https://www.apache.org/licenses/LICENSE-2.0",
  "Unless required by applicable law or agreed to in writing, software",
  'distributed under the License is distributed on an "AS IS" BASIS,',
  "WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
  "See the License for the specific language governing permissions and",
  "limitations under the License.",
];

const repeated = (count, line) => Array.from({ length: count }, () => line);

const proseBlock = (count) => createBlockComment(plainBlock(repeated(count, "prose")), 1);

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

describe("awesomeness/no-novel-comments", () => {
  it.each([
    {
      comments: prose(6),
      expected: 1,
      name: "reports a 6-line run of line comments",
    },
    {
      comments: prose(5),
      expected: 0,
      name: "allows a run sitting exactly at the limit",
    },
    {
      comments: [...prose(3), ...prose(3, 5)],
      expected: 0,
      name: "a blank source line splits one long run into two short runs",
    },
    {
      comments: [
        ...prose(3),
        createLineComment(" eslint-disable-next-line no-console", 4),
        ...prose(3, 5),
      ],
      expected: 0,
      name: "a directive comment splits the run instead of joining it",
    },
    {
      comments: lineRun(APACHE_BODY.map((line) => ` ${line}`)),
      expected: 0,
      name: "exempts a complete line-comment license header",
    },
    {
      comments: [createBlockComment(plainBlock(APACHE_BODY), 1)],
      expected: 0,
      name: "exempts a plain block license header",
    },
    {
      comments: [createBlockComment(jsdocBlock(APACHE_BODY), 1)],
      expected: 0,
      name: "exempts a JSDoc-style license header",
    },
    {
      comments: [createBlockComment(jsdocBlock(["@license MIT"]), 1)],
      expected: 0,
      name: "exempts a JSDoc @license marker on the second prose line",
    },
    {
      comments: [proseBlock(6)],
      expected: 1,
      name: "reports a block comment longer than the limit",
    },
    {
      comments: [proseBlock(3)],
      expected: 0,
      name: "allows a block comment at the limit",
    },
    {
      comments: [createBlockComment(`!\n${repeated(8, " prose").join("\n")}`, 1)],
      expected: 0,
      name: "exempts a bang-prefixed preserve block",
    },
    {
      comments: [...prose(9), createLineComment(" Copyright headers go in new files", 10)],
      expected: 1,
      name: "a trailing Copyright mention does not exempt a long prose run",
    },
    {
      comments: [...prose(3), createBlockComment(plainBlock(["prose"]), 4), ...prose(3, 6)],
      expected: 0,
      name: "a block comment interrupts an otherwise contiguous line run",
    },
    {
      comments: [
        ...prose(3),
        createBlockComment(" eslint-disable ", 4),
        createLineComment(" prose 4", 4),
        ...prose(3, 5),
      ],
      expected: 1,
      name: "an exempt block does not hide prose sharing its source line",
    },
  ])("$name", ({ comments, expected }) => {
    expect(runNoNovelComments(comments)).toHaveLength(expected);
  });
});

describe("oxlint-config-awesomeness", () => {
  it("exports a non-null object", () => {
    expect(config).not.toBeNull();
    expect(typeof config).toBe("object");
  });

  it("matches the TypeScript source at runtime", () => {
    expect(config).toEqual(sourceConfig);
  });

  it("registers the vendored anti-slop plugin and all 17 of its rules", async () => {
    expect(config.jsPlugins).toContainEqual({
      name: "anti-slop",
      specifier: "oxlint-config-awesomeness/anti-slop",
    });

    const { default: plugin } = await import("oxlint-config-awesomeness/anti-slop");
    const ruleNames = Object.keys(plugin.rules).toSorted();
    expect(ruleNames).toHaveLength(17);
    for (const ruleName of ruleNames) {
      expect(config.rules).toHaveProperty(`anti-slop/${ruleName}`);
    }
  });

  it("registers the first-party awesomeness plugin and its rules", async () => {
    expect(config.jsPlugins).toContainEqual({
      name: "awesomeness",
      specifier: "oxlint-config-awesomeness/awesomeness",
    });

    const { default: plugin } = await import("oxlint-config-awesomeness/awesomeness");
    for (const ruleName of Object.keys(plugin.rules)) {
      expect(config.rules).toHaveProperty(`awesomeness/${ruleName}`);
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

  it("enables the plugin for test files only", () => {
    expect(testOverride.plugins).toEqual(["vitest"]);
    expect(config.plugins).not.toContain("vitest");
  });

  it("keeps the assertion that catches an un-awaited `.resolves`", () => {
    expect(testOverride.rules).not.toHaveProperty("vitest/valid-expect");
  });

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

describe("oxlint-config-awesomeness/shadcn", () => {
  it("registers @shadcn/lint and all six of its rules as errors", async () => {
    const { default: shadcn } = await import("oxlint-config-awesomeness/shadcn");
    const { plugin } = await import("@shadcn/lint");

    expect(shadcn.jsPlugins).toEqual(["@shadcn/lint"]);
    for (const ruleName of Object.keys(plugin.rules)) {
      const setting = shadcn.rules[`shadcn/${ruleName}`];
      expect(Array.isArray(setting) ? setting[0] : setting).toBe("error");
    }
  });

  it("stays out of the base config, so repos without shadcn need no plugin", () => {
    expect(config.jsPlugins).not.toContain("@shadcn/lint");
  });
});

describe("TanStack route options", () => {
  it("leaves route factory objects in the order TanStack infers types from", () => {
    const [severity, routeOptions, defaultOptions] = config.rules["perfectionist/sort-objects"];
    expect(severity).toBe("error");
    expect(routeOptions.type).toBe("unsorted");
    expect('createFileRoute("/")').toMatch(
      new RegExp(routeOptions.useConfigurationIf.callingFunctionNamePattern, "v"),
    );
    expect(defaultOptions).toEqual({ partitionByComment: true });
    expect(config.rules["react-doctor/tanstack-start-route-property-order"]).toBe("error");
  });
});

import { describe, expect, it } from "vitest";

import awesomenessPlugin from "./awesomeness/index.js";
import sourceConfig from "./src/index.ts";

import config from "./index.js";

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

  it("registers the vendored anti-slop plugin and all 10 of its rules", async () => {
    expect(config.jsPlugins).toContainEqual({
      name: "anti-slop",
      specifier: "oxlint-config-awesomeness/anti-slop",
    });

    const { default: plugin } = await import("./anti-slop/index.js");
    const ruleNames = Object.keys(plugin.rules).toSorted();
    expect(ruleNames).toHaveLength(10);
    for (const ruleName of ruleNames) {
      expect(config.rules).toHaveProperty(`anti-slop/${ruleName}`);
    }
  });

  it("registers the first-party awesomeness plugin and its rules", async () => {
    expect(config.jsPlugins).toContainEqual({
      name: "awesomeness",
      specifier: "oxlint-config-awesomeness/awesomeness",
    });

    const { default: plugin } = await import("./awesomeness/index.js");
    for (const ruleName of Object.keys(plugin.rules)) {
      expect(config.rules).toHaveProperty(`awesomeness/${ruleName}`);
    }
  });

  it("has the expected top-level keys", () => {
    // Any key change here is a breaking contract change for consumers.
    const keys = Object.keys(config).toSorted();
    expect(keys).toEqual(
      ["categories", "env", "jsPlugins", "overrides", "plugins", "rules"].toSorted(),
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

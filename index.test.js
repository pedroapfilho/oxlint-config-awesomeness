import { describe, expect, it } from "vitest";

import awesomenessPlugin from "./awesomeness/index.js";

import config from "./index.js";

const createLineComment = (value, line) => ({
  loc: {
    end: { column: value.length + 2, line },
    start: { column: 0, line },
  },
  type: "Line",
  value,
});

const runNoNovelComments = (comments) => {
  const reports = [];
  const rule = awesomenessPlugin.rules["no-novel-comments"];
  const visitors = rule.create({
    options: [],
    report: (report) => reports.push(report),
    sourceCode: { getAllComments: () => comments },
  });

  const runProgramVisitor = visitors.Program;
  runProgramVisitor();
  return reports;
};

describe("oxlint-config-awesomeness", () => {
  it("exports a non-null object", () => {
    expect(config).not.toBeNull();
    expect(typeof config).toBe("object");
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

  it("enforces one component per file outside stories and tests", () => {
    expect(config.rules["react/no-multi-comp"]).toBe("error");

    const testOverride = config.overrides.find((override) =>
      override.files.includes("**/__tests__/**"),
    );
    expect(testOverride.files).toEqual(["**/*.test.*", "**/*.spec.*", "**/__tests__/**"]);
    expect(testOverride.rules["react/no-multi-comp"]).toBe("off");
  });

  it("exempts complete line-comment license headers", () => {
    const licenseLines = [
      " Copyright (c) 2026 Example",
      ' Licensed under the Apache License, Version 2.0 (the "License");',
      " you may not use this file except in compliance with the License.",
      " You may obtain a copy of the License at",
      " https://www.apache.org/licenses/LICENSE-2.0",
      " Unless required by applicable law or agreed to in writing, software",
      ' distributed under the License is distributed on an "AS IS" BASIS,',
      " WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
      " See the License for the specific language governing permissions and",
      " limitations under the License.",
    ];
    const comments = licenseLines.map((line, index) => createLineComment(line, index + 1));

    expect(runNoNovelComments(comments)).toEqual([]);
  });

  it("reports long line-comment runs without a license marker", () => {
    const comments = Array.from({ length: 6 }, (_, index) =>
      createLineComment(` prose ${index + 1}`, index + 1),
    );

    expect(runNoNovelComments(comments)).toHaveLength(1);
  });

  it("has the expected top-level keys", () => {
    // Lock the exact shape — any key change is a breaking contract change.
    const keys = Object.keys(config).toSorted();
    expect(keys).toEqual(
      ["categories", "env", "jsPlugins", "overrides", "plugins", "rules"].toSorted(),
    );
  });
});

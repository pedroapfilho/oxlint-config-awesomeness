import { describe, expect, it } from "vitest";

import config from "./index.js";

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
  });

  it("has the expected top-level keys", () => {
    // Lock the exact shape — any key change is a breaking contract change.
    const keys = Object.keys(config).toSorted();
    expect(keys).toEqual(
      ["categories", "env", "jsPlugins", "overrides", "plugins", "rules"].toSorted(),
    );
  });
});

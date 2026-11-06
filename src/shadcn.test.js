import packageJson from "oxlint-config-awesomeness/package.json" with { type: "json" };
import { describe, expect, it } from "vitest";

import shadcn from "./shadcn.ts";

import config from "./index.ts";

describe("oxlint-config-awesomeness/shadcn", () => {
  it("registers @shadcn/lint and all six of its rules as errors", async () => {
    const { plugin } = await import("@shadcn/lint");

    expect(shadcn.jsPlugins).toEqual(["@shadcn/lint"]);
    expect(packageJson.peerDependenciesMeta["@shadcn/lint"]).toEqual({ optional: true });

    for (const ruleName of Object.keys(plugin.rules)) {
      const setting = shadcn.rules[`shadcn/${ruleName}`];
      expect(Array.isArray(setting) ? setting[0] : setting).toBe("error");
    }
  });

  it("stays out of the base config, so repos without shadcn need no plugin", () => {
    expect(JSON.stringify(config.jsPlugins)).not.toContain("@shadcn/lint");
  });
});

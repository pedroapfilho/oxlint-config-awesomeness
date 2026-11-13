import config from "oxlint-config-awesomeness";
import packageJson from "oxlint-config-awesomeness/package.json" with { type: "json" };
import { describe, expect, it } from "vitest";

describe("oxlint-config-awesomeness", () => {
  it.each(["anti-slop", "awesomeness"])(
    "registers the %s plugin and configures every rule it exports",
    async (name) => {
      const specifier = import.meta.resolve(`oxlint-config-awesomeness/${name}`);
      expect(config.jsPlugins).toContainEqual({ name, specifier });

      const { default: plugin } = await import(specifier);

      for (const ruleName of Object.keys(plugin.rules)) {
        expect(config.rules).toHaveProperty(`${name}/${ruleName}`);
      }
    },
  );

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
});

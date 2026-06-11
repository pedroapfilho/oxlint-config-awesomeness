import { describe, expect, it } from "vitest";

import config from "./index.js";

describe("oxlint-config-awesomeness", () => {
  it("exports a non-null object", () => {
    expect(config).not.toBeNull();
    expect(typeof config).toBe("object");
  });

  it("has the expected top-level keys", () => {
    // Lock the exact shape — any key change is a breaking contract change.
    const keys = Object.keys(config).toSorted();
    expect(keys).toEqual(
      ["categories", "env", "jsPlugins", "overrides", "plugins", "rules"].toSorted(),
    );
  });
});

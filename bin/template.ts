import awesomeness from "oxlint-config-awesomeness";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [awesomeness],
  // Both flags are root-only and need `oxlint-tsgolint` installed.
  options: {
    typeAware: true,
    typeCheck: true,
  },
});

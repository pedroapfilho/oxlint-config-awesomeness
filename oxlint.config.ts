import { defineConfig } from "oxlint";
import config from "oxlint-config-awesomeness";
import shadcn from "oxlint-config-awesomeness/shadcn";

export default defineConfig({
  extends: [config, shadcn],
  rules: {
    "shadcn/no-restyle": [
      "error",
      {
        allow: ["layout"],
        contracts: [
          {
            allow: ["layout", "gap-*"],
            pattern: "^PopoverTrigger$",
          },
        ],
      },
    ],
  },
  // The vendored third-party bundle is checked upstream.
  ignorePatterns: [".github/ci/*.mjs", "anti-slop/index.js"],
  overrides: [
    {
      files: ["src/index.ts"],
      rules: {
        // The rule inventory is documentation-dense by design; its long
        // section comments are the point of the file.
        "awesomeness/no-novel-comments": "off",
        "max-lines": "off",
      },
    },
  ],
});

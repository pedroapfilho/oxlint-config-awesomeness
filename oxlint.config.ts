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
  // Generated output and the vendored third-party bundle are checked at source.
  ignorePatterns: [".github/ci/*.mjs", "dist/**", "anti-slop/index.js"],
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
    {
      // The CLI source lives in src/ so the build can emit it, but it is CLI
      // code: the shipped `**/bin/**` override does not reach it here.
      files: ["src/init.ts"],
      rules: {
        "anti-slop/no-unknown-parameters": "off",
        "node/no-sync": "off",
      },
    },
  ],
});

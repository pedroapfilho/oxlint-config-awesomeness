import { defineConfig } from "oxlint";
import config from "oxlint-config-awesomeness";

export default defineConfig({
  extends: [config],
  jsPlugins: ["@shadcn/lint"],
  rules: {
    "shadcn/no-arbitrary-values": "error",
    "shadcn/no-inline-styles": "error",
    "shadcn/no-raw-colors": "error",
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
    "shadcn/no-unknown-classes": "error",
    "shadcn/require-static-classes": "error",
  },
  // Generated output and the vendored third-party bundle are checked at source.
  ignorePatterns: ["dist/**", "anti-slop/index.js"],
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

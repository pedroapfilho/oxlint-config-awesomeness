import { plugin as shadcn } from "@shadcn/lint";
import tsParser from "@typescript-eslint/parser";
import type { AST } from "astro-eslint-parser";
import * as astroParser from "astro-eslint-parser";
import type { ESLint, Linter } from "eslint";
import type { OxlintConfig } from "oxlint";

import shadcnPreset from "./shadcn.js";

const verifiableAttributes = {
  create: (context) => ({
    'JSXAttribute[name.name="style"][value.type="Literal"]': (node: AST.JSXAttribute) => {
      context.report({ messageId: "style", node });
    },
    'JSXAttribute[name.namespace.name="class"][name.name.name="list"]': (
      node: AST.JSXAttribute,
    ) => {
      context.report({ messageId: "classes", node });
    },
  }),
  meta: {
    messages: {
      classes: "Use class={cn(...)} with complete class strings.",
      style: "Move inline CSS into the owning stylesheet.",
    },
    schema: [],
  },
} satisfies NonNullable<ESLint.Plugin["rules"]>[string];

const astro = (config: OxlintConfig): Array<Linter.Config> => [
  {
    files: ["**/*.astro"],
    languageOptions: { parser: astroParser, parserOptions: { parser: tsParser } },
    plugins: {
      astro: { rules: { "verifiable-attributes": verifiableAttributes } },
      shadcn,
    },
    rules: {
      ...Object.fromEntries(
        Object.entries({ ...shadcnPreset.rules, ...config.rules }).filter(([name]) =>
          name.startsWith("shadcn/"),
        ),
      ),
      "astro/verifiable-attributes": "error",
    },
    settings: config.settings ?? {},
  },
];

export default astro;

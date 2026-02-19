# `oxlint-config-awesomeness`

_Opinionated Oxlint config with sensible defaults._

## Installation & Usage

With Oxlint v1.46+:

```
npm install -D oxlint-config-awesomeness eslint-plugin-no-only-tests eslint-plugin-perfectionist eslint-plugin-react-hooks eslint-plugin-unused-imports
```

> [!NOTE]
> Due to a limitation in Oxlint's configuration resolver, you have to directly install the JS plugins for now.

In your `oxlint.config.ts`:

```js
import awesomeness from 'oxlint-config-awesomeness';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [awesomeness],
});
```

Then run `pnpm oxlint` or `npm oxlint`.

## Philosophy & Principles

Use this configuration if these principles resonate with you:

- **Error, Never Warn:** Warnings are noise and get ignored. Either it's an issue, or it isn't. This config forces developers to fix problems or explicitly disable the rule with a comment.
- **Strict, Consistent Code Style:** When multiple approaches exist, this configuration enforces the strictest, most consistent code style, preferring modern language features and best practices.
- **Prevent Bugs:** Debug-only code such as `console.log` or `test.only` are disallowed to avoid unintended logging in production or accidental CI failures.
- **Fast:** Slow rules are avoided. For example, TypeScript's `noUnusedLocals` check is preferred over `no-unused-vars`.
- **Don't get in the way:** Subjective or overly opinionated rules are disabled. Autofixable rules are preferred to reduce friction and save time.

## Included Plugins & Rules

This configuration consists of the most useful and least annoying rules from the following ESLint/Oxlint plugins:

- [`eslint-plugin-unicorn`](https://github.com/sindresorhus/eslint-plugin-unicorn)
- [`eslint-plugin-import-x`](https://github.com/un-ts/eslint-plugin-import-x)
- [`eslint-plugin-react`](https://github.com/jsx-eslint/eslint-plugin-react)
- [`eslint-plugin-react-hooks`](https://github.com/nicolo-ribaudo/eslint-plugin-react-compiler)
- [`eslint-plugin-perfectionist`](https://perfectionist.dev/)
- [`eslint-plugin-no-only-tests`](https://github.com/levibuzolic/eslint-plugin-no-only-tests)
- [`eslint-plugin-unused-imports`](https://github.com/sweepline/eslint-plugin-unused-imports)

### TypeScript Override

Rules that TypeScript already checks (like `no-undef`, `no-redeclare`, `constructor-super`) are automatically disabled for `.ts`, `.tsx`, `.mts`, and `.cts` files to prevent false positives.

## Suggestions

This configuration is meant to be used with:

- [TypeScript](https://www.typescriptlang.org/) and the [`noUnusedLocals`](https://www.typescriptlang.org/tsconfig#noUnusedLocals) setting
- [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)

## Credits

Based on [`@nkzw/oxlint-config`](https://github.com/nkzw-tech/oxlint-config) by [Christoph Nakazawa](https://github.com/cpojer).

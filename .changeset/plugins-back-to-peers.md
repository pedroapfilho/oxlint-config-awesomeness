---
"oxlint-config-awesomeness": patch
---

Move `@nkzw/eslint-plugin`, `eslint-plugin-no-only-tests`, `eslint-plugin-perfectionist`, and `eslint` back to peer dependencies. As dependencies they made pnpm install TypeScript 6 in monorepos without a root `typescript`, because typescript-eslint's peer range stops below 7, and that left this package's `typescript` peer unmet. The plugins still load from this package, so they don't need to be linked in your project root.

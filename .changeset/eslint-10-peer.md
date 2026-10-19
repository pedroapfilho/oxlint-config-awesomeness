---
"oxlint-config-awesomeness": minor
---

Declare `eslint` as a peer dependency at `^10.0.0`. The ESLint plugins the config loads through oxlint load `eslint` at runtime via `@typescript-eslint/utils`, but only declare `eslint >= 9`, so a consumer kept whatever version pnpm auto-installed first, often the end-of-life 9.x line.

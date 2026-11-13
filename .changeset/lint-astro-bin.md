---
"oxlint-config-awesomeness": minor
---

Add `lint-astro`, a bin that runs the shadcn preset over Astro templates. oxlint lints an `.astro` file's frontmatter and never reads its template, so until now each Astro repo carried its own ESLint config and runner for that. `lint-astro` lints every tracked `.astro` file, takes the `shadcn/*` rules and `settings` from the repo's `oxlint.config.ts`, and exits 1 on any error or warning.

Two exports come with it. `oxlint-config-awesomeness/astro` is the ESLint config as a function of your oxlint config. `oxlint-config-awesomeness/typescript6` is the resolve hook that points `typescript` at `@typescript/typescript6`, which typescript-eslint needs until it can load TypeScript 7; pass it to `node --import` for tools such as `astro check`.

`@typescript-eslint/parser`, `astro-eslint-parser` and `@typescript/typescript6` are new optional peer dependencies. Only repos that run `lint-astro` install them, and nothing changes for anyone else.

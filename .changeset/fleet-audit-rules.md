---
"oxlint-config-awesomeness": minor
---

Tune the config against how the managed repositories actually use it, enable rules for the libraries they now ship, and add an opt-in shadcn/ui preset.

Report stale suppressions:

- `options.reportUnusedDisableDirectives: "warn"` reports `oxlint-disable`/`eslint-disable` comments that no longer suppress anything, including ones naming rules oxlint does not know (`react-hooks-js/*`, `@next/next/*`).

Fix rules that fight the toolchain or the fleet's layout:

- `unicorn/number-literal-case` is off. oxfmt lowercases hex digits and the rule demands uppercase, so no hex literal with letters could satisfy both.
- The CLI override now matches `**/scripts/**`, so per-app script folders in a monorepo get the same `no-console`/`no-process-exit`/`no-sync` relaxations as a root `scripts/` folder.
- `require-await` is off for TypeScript files, where the type-aware `@typescript-eslint/require-await` reported every hit a second time.
- `new-cap` no longer checks capitalized calls in TypeScript (`capIsNew: false`). TypeScript already rejects calling a class without `new`, so it only fired on factories such as `next/font` loaders.
- New overrides: `*.d.ts` allows `interface` for declaration merging; `*.astro` turns off `react-doctor/no-impure-call-at-module-scope` and `unused-imports/no-unused-imports`; Next.js `middleware.ts`/`proxy.ts` turn off `unicorn/prefer-string-raw` so `config.matcher` stays a plain string literal.
- The e2e override also turns off `no-empty-pattern` (Playwright's `async ({}, use)` fixtures) and `require-unicode-regexp` (Playwright rejects `v`-flagged regex).
- `no-underscore-dangle` allows Prisma's aggregate keys (`_count`, `_sum`, `_avg`, `_min`, `_max`, `_all`).
- `react-doctor/async-await-in-loop` is off, like core `no-await-in-loop`: the fleet carried 58 reasoned suppressions of it for deliberately sequential awaits.

Test files:

- The vitest plugin now runs on `*.test.*`, `*.spec.*`, and `__tests__/**`. Its correctness rules are on, including `valid-expect`, which reports an un-awaited `.resolves`/`.rejects` assertion that never runs, plus the style rules the repos already follow. `vitest/no-focused-tests` stays off because `no-only-tests` already covers `.only`.

Enable rules:

- Errors: `no-sequences` (no parenthesized exemption), `no-unreachable-loop`, `@typescript-eslint/no-namespace`, `unicorn/no-length-as-slice-end`, `promise/no-return-in-finally`, `oxc/bad-bitwise-operator`.
- Warnings: `no-useless-assignment` (warn because its dataflow cannot see reads inside callbacks) and `react-doctor/prefer-dvh-over-vh`.
- React Doctor at upstream severities: the Base UI, shadcn, TanStack Form, and TanStack Table rules added in 0.9.13, the remaining TanStack Query rules, and the Motion, Zustand, Ink, TanStack Start, and React Native families. `expo-no-non-inlined-env` and `rn-no-dimensions-get` stay off because they fire on server code in monorepos that ship a React Native app; the React Native preferences upstream ships off stay off too.

Drop retired React Doctor rules:

- react-doctor 0.9.14 retired 33 rules (their rule body is now empty). The 15 this config enabled are removed so the config matches what runs: `activity-wraps-effect-heavy-subtree`, `client-localstorage-no-version`, `hooks-no-nan-in-deps`, `js-early-exit`, `js-tosorted-immutable`, `no-cascading-set-state`, `no-jsx-element-type`, `no-many-boolean-props`, `no-multi-component-file`, `no-polymorphic-children`, `no-render-prop-children`, `no-scale-from-zero`, `prefer-explicit-variants`, `rendering-animate-svg-wrapper`, `rendering-usetransition-loading`. Repos still on 0.9.13 stop seeing them now instead of at their next plugin bump.

New `oxlint-config-awesomeness/shadcn` preset:

- `extends: [awesomeness, shadcn]` registers `@shadcn/lint` and enables its six rules as errors, replacing the block each shadcn/ui repo copied into its own config. `@shadcn/lint` (`>=0.1.0 <0.3.0`) is an optional peer dependency.

Peer ranges: `oxlint-plugin-react-doctor` is now `^0.9.13`, the first release with the Base UI, shadcn, and TanStack Form/Table rules.

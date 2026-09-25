# oxlint-config-awesomeness

## 4.6.0

### Minor Changes

- a983db8: Tune the config against how the managed repositories actually use it, enable rules for the libraries they now ship, and add an opt-in shadcn/ui preset.

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
  - `perfectionist/sort-objects` leaves options passed to `createFileRoute`, `createRoute`, `createRootRoute`, and `createRootRouteWithContext` unsorted. TanStack Router infers types from option order, and `react-doctor/tanstack-start-route-property-order` rejects the alphabetical order sorting would impose. Objects inside loaders and unrelated factories still get sorted.
  - `react-doctor/async-await-in-loop` is off, like core `no-await-in-loop`: the fleet carried 58 reasoned suppressions of it for deliberately sequential awaits.

  Test files:

  - The vitest plugin now runs on `*.test.*`, `*.spec.*`, and `__tests__/**`. Its correctness rules are on, including `valid-expect`, which reports an un-awaited `.resolves`/`.rejects` assertion that never runs, plus the style rules the repos already follow. These assertion checks recognize Vitest imports and supported test globals; Playwright's `@playwright/test` imports require a separate framework-specific linter. `vitest/no-focused-tests` stays off because `no-only-tests` already covers `.only`.
  - `vitest/expect-expect` reports tests with no assertion; calls to `expect*`, `assert*`, `expectTypeOf`, `assertType`, `waitFor`, and Testing Library's throwing `getBy*`/`findBy*` queries count, so shared helpers work. `vitest/require-to-throw-message` warns on a bare `toThrow()`, which passes on any error.

  Guardrails for generated code:

  - New first-party rule `awesomeness/require-disable-reason` (warn): every `oxlint-disable`/`eslint-disable` directive needs `-- reason`, the lint counterpart of `ban-ts-comment` requiring a description on `@ts-expect-error`. It warns while the 303 unexplained directives across the managed repos are explained or deleted; it becomes an error in a later release.
  - `no-warning-comments` also rejects `todo`, `fixme`, and `xxx`, so placeholders do not ship.
  - `@typescript-eslint/no-unnecessary-condition` (warn, off in tests and e2e) reports defensive checks on values the types rule out; `@typescript-eslint/prefer-optional-chain` (error) replaces `a && a.b` chains.
  - `react/no-clone-element` rejects the legacy prop-injection API; `react/rule-suppression` warns when disabling a React rule makes the compiler skip a component.
  - Rules most peer configs enable and this one lacked, none of which fires more than three times across the managed repos: `no-regex-spaces`, `unicode-bom`, `@typescript-eslint/prefer-literal-enum-member`, `react/require-render-return`, `import/no-amd`, `import/no-webpack-loader-syntax`, `promise/spec-only`, `unicorn/no-useless-error-capture-stack-trace`.

  Enable rules:

  - Errors: `no-sequences` (no parenthesized exemption), `no-unreachable-loop`, `@typescript-eslint/no-namespace`, `unicorn/no-length-as-slice-end`, `promise/no-return-in-finally`, `oxc/bad-bitwise-operator`.
  - Warnings: `no-useless-assignment` (warn because its dataflow cannot see reads inside callbacks) and `react-doctor/prefer-dvh-over-vh`.
  - React Doctor at upstream severities: the Base UI, shadcn, TanStack Form, and TanStack Table rules added in 0.9.13, the remaining TanStack Query rules, and the Motion, Zustand, Ink, TanStack Start, and React Native families. `expo-no-non-inlined-env` and `rn-no-dimensions-get` stay off because they fire on server code in monorepos that ship a React Native app; the React Native preferences upstream ships off stay off too.

  Drop retired React Doctor rules:

  - react-doctor 0.9.14 retired 33 rules (their rule body is now empty). The 15 this config enabled are removed so the config matches what runs: `activity-wraps-effect-heavy-subtree`, `client-localstorage-no-version`, `hooks-no-nan-in-deps`, `js-early-exit`, `js-tosorted-immutable`, `no-cascading-set-state`, `no-jsx-element-type`, `no-many-boolean-props`, `no-multi-component-file`, `no-polymorphic-children`, `no-render-prop-children`, `no-scale-from-zero`, `prefer-explicit-variants`, `rendering-animate-svg-wrapper`, `rendering-usetransition-loading`. Repos still on 0.9.13 stop seeing them now instead of at their next plugin bump.

  New `oxlint-config-awesomeness/shadcn` preset:

  - `extends: [awesomeness, shadcn]` registers `@shadcn/lint` and enables its six rules as errors, replacing the block each shadcn/ui repo copied into its own config. `@shadcn/lint` (`>=0.1.0 <0.3.0`) is an optional peer dependency.

  Peer ranges: `oxlint-plugin-react-doctor` is now `^0.9.13`, the first release with the Base UI, shadcn, and TanStack Form/Table rules.

## 4.5.1

### Patch Changes

- 204dbd9: Ship type declarations for the `oxlint-config-awesomeness/anti-slop` export. The vendored bundle is JavaScript, so `tsc` emitted nothing for it and importing the subpath from a TypeScript config resolved to an untyped module.

## 4.5.0

### Minor Changes

- 7ceb564: Update the vendored anti-slop plugin to upstream `95a56e5` and enable its two new rules, `no-array-filter-map` and `no-reduce-accumulator-copy`, as errors. Existing rules pick up upstream's tightened diagnostics and alias resolution; the local member-property exemption in `no-shape-in-symbol-names` is now upstream and was dropped from the bundle.

### Patch Changes

- 7ceb564: Publish the config, first-party plugin, type declarations, and CLI from an untracked `dist/` directory instead of committing generated entrypoints. Public imports and CLI behavior stay the same; the package builds before packing and CI builds before running checks.

## 4.4.0

### Minor Changes

- 21d33a5: Close the rule gap against nkzw-tech/oxlint-config with five additions:

  - `@nkzw/require-use-effect-arguments` (error) — require an explicit dependency array on `useEffect`; new `@nkzw/eslint-plugin` peer dependency. The plugin's other rules (`ensure-relay-types`, `no-instanceof`) stay off.
  - `import/export` (error) — duplicate or ambiguous exports; nursery-classified in oxlint, so enabled by name.
  - `unicorn/no-magic-array-flat-depth` (error) — no bare numbers as `.flat()` depth.
  - `perfectionist/sort-interfaces` (error) — sorted interface members in the `.d.ts`/ambient files where interfaces still appear.
  - `no-unused-vars` now ignores `_`-prefixed variables and arguments (`argsIgnorePattern`/`varsIgnorePattern: "^_"`).

## 4.3.0

### Minor Changes

- a1fca52: Turn off `one-var`. The rule ships in the `style` category we bulk-enable, so it is now pinned to `"off"` rather than removed, which would restore the upstream `"always"` default.

## 4.2.0

### Minor Changes

- a768004: Replace `react/no-multi-comp` with `react-doctor/no-multi-component-file` (new in react-doctor 0.9.12) at `warn`.

  The native rule flagged any file declaring more than one component, which hit every shadcn primitive family, so this config had it turned off. The react-doctor rule only fires when the extra components are **not exported**, meaning they are secondary components hiding in a file rather than a published family. Verified against the fleet: it leaves `card.tsx` and `accordion.tsx` alone (7 and 4 exported components) and flags a file that declares 7 and exports only the compound object.

  The `react/no-multi-comp: "off"` entry is gone, since the rule is not in any category this config enables and the new rule documents the position.

  Bump `oxlint-plugin-react-doctor` to 0.9.12 and `fallow` to 3.17.0. The other 96 rules new in 0.9.12 are Three.js and React Three Fiber, which stay off: no managed repo ships either.

## 4.1.0

### Minor Changes

- f52ea14: Tune rules the managed repos were overriding anyway, based on an audit of 505 inline suppressions and 90 config-level disables across 9 repos.

  `no-await-in-loop` is now off. It assumes loop bodies are independent and should be parallelised, but the dominant patterns in these codebases are inherently sequential: cursor pagination, rate-limited fan-out, and retry backoff. It was suppressed 105 times across 7 repos and disabled outright in 6, and every justification sampled was legitimate. `react-doctor/async-await-in-loop` still warns on the genuinely parallelisable cases, so the advisory survives.

  The CLI override (`**/bin/**`, `scripts/**`) now also covers `tools/**`, and turns off the type-assertion family, `@typescript-eslint/no-unsafe-type-assertion`, and `require-unicode-regexp` there. One-shot scripts parse their own local JSON output, where a schema at the boundary is ceremony.

  Config files additionally turn off `node/no-sync` and `require-unicode-regexp`; test files turn off the same two. Both were disabled in 7 to 8 of 9 repos, in consistently the same places.

  Nothing that catches real bugs was weakened. `no-unsafe-type-assertion` stays on outside one-shot scripts: it is the most suppressed rule in the fleet, but 52 of 58 sampled suppressions carry a written justification, which is the rule working rather than failing.

## 4.0.1

### Patch Changes

- d5bef96: Scaffold a minimal config. `npx oxlint-config-awesomeness init` no longer writes `options: { typeAware, typeCheck }` into the generated `oxlint.config.ts`, because 4.0.0 sets both and they inherit through `extends`. Scaffolded repos now follow the shared config instead of pinning those flags locally.

  Author the `init` CLI in TypeScript: `src/init.ts` is the source and `bin/init.js` is generated by the same build as the other entrypoints, so the last hand-written runtime file is now type-checked. Behaviour is unchanged and the shebang is preserved.

  Document the `@typescript-eslint` peer warning. It caps TypeScript at `<6.1.0`, arrives transitively via `eslint-plugin-perfectionist`, and cannot be satisfied alongside the TypeScript 7 requirement. The README shows the `peerDependencyRules` block that silences it.

## 4.0.0

### Major Changes

- 0c329e0: Switch the React Compiler rules to oxlint's native port (oxlint 1.79+), replacing the `eslint-plugin-react-hooks` JS plugin.

  **Breaking.** Consumers must upgrade to oxlint >= 1.79.0 and can uninstall `eslint-plugin-react-hooks`, which is no longer a peer dependency. Rules moved from the `react-hooks-js/` prefix to `react/`, so any local override or disable comment naming a `react-hooks-js/*` rule needs renaming.

  Severities follow React's own presets. Five rules that oxlint files under enabled categories are off here because React ships them off and each misfires on non-React code: `react/capitalized-calls` (flags schema factories), `react/hooks` (flags agent DSLs whose functions are named `use*`), `react/exhaustive-effect-dependencies` (duplicates `react-hooks/exhaustive-deps`), `react/memo-dependencies`, and `react/no-deriving-state-in-effects`. The whole family is also off in test and e2e files, where probe components legitimately capture render state into outer variables.

  `config` and `gating` have no native port and `component-hook-factories` was not ported, so those three checks are gone.

  Also enable type-aware linting via `options.typeAware`, which activates the 59 typescript-eslint rules that need a type checker. This requires the new `oxlint-tsgolint` peer dependency (the `7.x` line targets TypeScript 7); without it oxlint silently skips those rules rather than failing. Type-dependent rules are turned off for `.js`, `.jsx`, `.mjs`, and `.cjs` files, which sit outside the tsconfig program where every expression resolves to `any`.

  TypeScript 7 is now a peer dependency, and `options.typeCheck` is on, so oxlint reports TypeScript compiler diagnostics alongside lint findings in a single stream and a separate `tsc --noEmit` step becomes optional. `tsc` is still required wherever it emits, and oxlint labels `typeCheck` experimental.

  tsgolint carries its own TypeScript 7 checker. On a repo still on TypeScript 6 that surfaces upgrade work early rather than reporting anything false: against a TypeScript 6 package whose own `tsc` exits clean, every diagnostic oxlint reported was reproduced exactly, same codes and positions, by real TypeScript 7 `tsc`. Set `options: { typeCheck: false }` in your own config to opt out.

### Patch Changes

- 07458f0: Author the first-party plugin in TypeScript. `src/awesomeness.ts` is now the source and `awesomeness/index.js` is generated by the existing build, so the plugin is type-checked against `@oxlint/plugins` types instead of being untyped JavaScript.

  The published plugin stays JavaScript on purpose: oxlint loads plugins with a plain `import()`, and Node refuses to type-strip files under `node_modules`, so a `.ts` entry would break every Node consumer. Rule behavior is unchanged.

## 3.5.1

### Patch Changes

- 7d00fd1: Ignore non-computed member properties in `no-shape-in-symbol-names` so external APIs remain compatible with Oxlint's dot-notation rule.

## 3.5.0

### Minor Changes

- da97d2c: Fix comment license detection and init safety, declare JS plugins as peers, consolidate CI and README checks, and generate the package entrypoints from a type-checked TypeScript source.
- cddabfc: Update the vendored anti-slop plugin and enforce its five new generic rules.

## 3.4.2

### Patch Changes

- f547f3c: Downgrade four high-volume rules from error to warn: `anti-slop/no-known-value-widening`, `anti-slop/no-conditional-empty-object-spread`, `anti-slop/no-unsafe-dictionary-type` and `awesomeness/no-novel-comments`.

  Measured across four monorepos, these four accounted for 192 of 386 errors, and the flagged sites are overwhelmingly deliberate: `Record<Union, string>` lookup tables, optional-key spreads in Next config, `Record<string, unknown>` at real boundaries, and long comments describing external-system behavior. A rule that flags several hundred sites in reviewed code is measuring style, not defects. The warnings still print, so the signal stays visible without gating a build.

  `anti-slop/no-chained-type-assertions` stays at error: it fired on 7 sites total, and each one is a genuine `x as unknown as T` laundering that deserves an explicit justification.

## 3.4.1

### Patch Changes

- d2bf923: Turn `react/no-multi-comp` off. shadcn primitives ship as one-file component families and form shells colocate their single-use field components on purpose, so the rule fired 21 times on deliberate structure across the fleet with no defect behind any of them.

  Relax the `anti-slop` assertion family (`no-chained-type-assertions`, `no-known-value-widening`, `no-unknown-type-aliases`, `no-unsafe-dictionary-type`, `no-widen-then-assert`) in test and e2e files, matching the existing `no-unsafe-type-assertion` exemption. Tests sit on the far side of the parse boundary those rules guard: asserting on an untyped document the system emitted is the point of the test.

## 3.4.0

### Minor Changes

- c0b15f2: Add the anti-slop plugin (10 rules rejecting low-evidence TypeScript patterns), vendored from https://github.com/dmmulroy/anti-slop (MIT, commit b5d2288) because upstream is not published to npm yet. It ships as a compiled bundle at the `oxlint-config-awesomeness/anti-slop` subpath export and loads through `jsPlugins`, backed by a new `@oxlint/plugins` dependency.

  Severities: 7 rules at error (`no-chained-type-assertions`, `no-conditional-empty-object-spread`, `no-known-value-widening`, `no-object-parameters`, `no-unknown-type-aliases`, `no-unsafe-dictionary-type`, `no-widen-then-assert`), 2 at warn (`no-shape-in-symbol-names` matches zod's `schema.shape` API; `no-unknown-parameters` collides with the `use-unknown-in-catch-callback-variable` autofix), and 1 off (`no-runtime-typeof` flags every `typeof`, including SSR guards and type-guard narrowing).

- c0b15f2: Dependency refresh and the rules that came with it. **Requires oxlint >= 1.78** (peer range bumped from 1.75): older oxlint fails to parse the config because it does not know the `one-var` rule.

  - oxlint 1.75 -> 1.78: pins the new `one-var` style rule to `"never"` (one declaration per variable). Without the pin, oxlint's upstream default would error on every consecutive `const` demanding comma-combined declarations. Also newly active through categories: `oxc/bad-match-all-arg` (correctness: `matchAll` without the global flag throws) and `node/exports-style` (style: `module.exports` over the `exports` alias).
  - oxlint-plugin-react-doctor 0.9.6 -> 0.9.11: no rule additions or renames, false-positive reductions in effect cleanup detection.
  - eslint-plugin-perfectionist 5.9 -> 5.10.1: no new rules, sorting fixes.
  - Tooling: @changesets/cli 3, fallow 3, oxfmt 0.63, lint-staged 17.3, vitest 4.1.10.

- c0b15f2: Two additions against narrative slop and grab-bag files:

  - New first-party `awesomeness` plugin (shipped at the `oxlint-config-awesomeness/awesomeness` subpath) with `awesomeness/no-novel-comments` at error: flags any block comment or contiguous run of line comments longer than 5 lines. Directive comments (`eslint-`, `oxlint-`, `@ts-`, and similar) and license headers are exempt.
  - `react/no-multi-comp` at error: one React component per file, stateless included. Stories keep their existing exemption; test files are now exempt too, since inline provider wrappers and mock components are test idiom.

## 3.3.0

### Minor Changes

- ea9701c: Upgrade `oxlint-plugin-react-doctor` to 0.9.6 and enable 194 of its new rules.

  The plugin went from 337 to 787 rules between 0.5 and 0.9, with nothing removed
  or renamed, so no previously-enabled rule changes behaviour. Of the 450
  additions, 290 are gated on stack tokens this config's consumers ship (react,
  tailwind 4, next 15, ssr, i18n); 194 of those are enabled here at upstream
  severity:
  - **Accessibility (50):** original checks rather than ports of the jsx-a11y
    rules already enabled, covering Tailwind animation gating behind
    `motion-safe`, `rem` font sizing, control target sizes, landmark and heading
    structure, and focus visibility.
  - **Bugs (76):** hydration branches on browser globals, unguarded parses,
    effect and listener lifecycle mismatches, invalid DOM structure.
  - **Security (40):** secret leakage, injection sinks, cookie and JWT handling,
    redirect and postMessage trust.
  - **Runtime performance (15)** and the mechanically-checkable slice of
    **Maintainability (13)**.

  Left off: rules gated on libraries these repos do not use (ink, motion, r3f,
  firebase, supabase, react-router), and the upstream visual-taste bucket
  (decorative orbs, hero eyebrow chips, uniform feature-card grids), which encodes
  design positions rather than defects.

  `react-doctor/no-unguarded-browser-global-in-render-or-hook-init` is set to
  `warn` rather than its upstream `error`. It has no way to see an `ssr: false`
  dynamic boundary or an app that never renders on a server, so it reports both as
  unguarded reads.

  `react-doctor/query-mutation-missing-invalidation` is back on. 0.9 resolves
  `onSuccess` through scope, so a mutation invalidating via a named hook no longer
  reports as missing invalidation, while a mutation with no cache update still
  does.

## 3.2.1

### Patch Changes

- 731a7f2: Turn off `react-doctor/query-mutation-missing-invalidation`.

  The rule only scans the `useMutation` options object literal for a
  `queryClient.invalidateQueries`-style call, so a mutation that invalidates
  through a named hook (`onSuccess: invalidateWallets`) is reported as missing
  invalidation. Extracting invalidation into a hook is the idiomatic React Query
  pattern, and the rule cannot follow any indirection, so it fires on correct
  code while staying silent on the bug that actually bites (a mismatched
  `queryKey`). `oxlint-plugin-react-doctor` 0.9.x resolves the callback through
  scope and no longer misreports this; the rule can come back when this config
  moves off 0.5.x.

## 3.2.0

### Minor Changes

- a5632c1: Support oxlint type-aware linting (tsgolint stable) and oxlint 1.75.
  - Tune type-aware rules for fleet use: `prefer-readonly-parameter-types` and `unbound-method` off globally; the unsafe-`any` family, `no-unsafe-type-assertion`, and `strict-boolean-expressions` relaxed for test files, e2e harnesses, and config files.
  - Pin `react/function-component-definition` to arrow components (new in oxlint 1.75 categories; the default demands `function` declarations).
  - Scaffold template now enables `typeAware` and `typeCheck`.
  - Requires oxlint >= 1.75; consumers opt into type-aware linting by installing `oxlint-tsgolint` alongside.

## 3.1.0

### Minor Changes

- 25829a6: Add `oxlint-plugin-react-doctor` as a fifth JS-bridge plugin: 158 curated React Doctor diagnostic rules (state-and-effects, re-render performance, RSC/server, Next.js App Router, TanStack Query, Zod v4, bundle size, design) from the upstream `recommended` + `next` + `tanstack-query` presets at upstream severities. The a11y/react-builtins port buckets and six native-nextjs duplicates are excluded — oxlint's native plugins already cover them. Verified against acme and dashfoo: zero error-level hits on existing fleet code, warnings only.

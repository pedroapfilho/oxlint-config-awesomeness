# oxlint-config-awesomeness

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

---
"oxlint-config-awesomeness": minor
---

Upgrade `oxlint-plugin-react-doctor` to 0.9.6 and enable 194 of its new rules.

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

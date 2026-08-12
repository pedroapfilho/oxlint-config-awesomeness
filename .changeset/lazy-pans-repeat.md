---
"oxlint-config-awesomeness": patch
---

Downgrade four high-volume rules from error to warn: `anti-slop/no-known-value-widening`, `anti-slop/no-conditional-empty-object-spread`, `anti-slop/no-unsafe-dictionary-type` and `awesomeness/no-novel-comments`.

Measured across four monorepos, these four accounted for 192 of 386 errors, and the flagged sites are overwhelmingly deliberate: `Record<Union, string>` lookup tables, optional-key spreads in Next config, `Record<string, unknown>` at real boundaries, and long comments describing external-system behavior. A rule that flags several hundred sites in reviewed code is measuring style, not defects. The warnings still print, so the signal stays visible without gating a build.

`anti-slop/no-chained-type-assertions` stays at error: it fired on 7 sites total, and each one is a genuine `x as unknown as T` laundering that deserves an explicit justification.

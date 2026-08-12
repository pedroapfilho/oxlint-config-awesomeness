---
"oxlint-config-awesomeness": patch
---

Turn `react/no-multi-comp` off. shadcn primitives ship as one-file component families and form shells colocate their single-use field components on purpose, so the rule fired 21 times on deliberate structure across the fleet with no defect behind any of them.

Relax the `anti-slop` assertion family (`no-chained-type-assertions`, `no-known-value-widening`, `no-unknown-type-aliases`, `no-unsafe-dictionary-type`, `no-widen-then-assert`) in test and e2e files, matching the existing `no-unsafe-type-assertion` exemption. Tests sit on the far side of the parse boundary those rules guard: asserting on an untyped document the system emitted is the point of the test.

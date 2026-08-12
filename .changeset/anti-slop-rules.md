---
"oxlint-config-awesomeness": minor
---

Add the anti-slop plugin (10 rules rejecting low-evidence TypeScript patterns), vendored from https://github.com/dmmulroy/anti-slop (MIT, commit b5d2288) because upstream is not published to npm yet. It ships as a compiled bundle at the `oxlint-config-awesomeness/anti-slop` subpath export and loads through `jsPlugins`, backed by a new `@oxlint/plugins` dependency.

Severities: 7 rules at error (`no-chained-type-assertions`, `no-conditional-empty-object-spread`, `no-known-value-widening`, `no-object-parameters`, `no-unknown-type-aliases`, `no-unsafe-dictionary-type`, `no-widen-then-assert`), 2 at warn (`no-shape-in-symbol-names` matches zod's `schema.shape` API; `no-unknown-parameters` collides with the `use-unknown-in-catch-callback-variable` autofix), and 1 off (`no-runtime-typeof` flags every `typeof`, including SSR guards and type-guard narrowing).

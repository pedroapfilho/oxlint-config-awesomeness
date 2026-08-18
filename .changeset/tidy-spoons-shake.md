---
"oxlint-config-awesomeness": major
---

Switch the React Compiler rules to oxlint's native port (oxlint 1.79+), replacing the `eslint-plugin-react-hooks` JS plugin.

**Breaking.** Consumers must upgrade to oxlint >= 1.79.0 and can uninstall `eslint-plugin-react-hooks`, which is no longer a peer dependency. Rules moved from the `react-hooks-js/` prefix to `react/`, so any local override or disable comment naming a `react-hooks-js/*` rule needs renaming.

Severities follow React's own presets. Five rules that oxlint files under enabled categories are off here because React ships them off and each misfires on non-React code: `react/capitalized-calls` (flags schema factories), `react/hooks` (flags agent DSLs whose functions are named `use*`), `react/exhaustive-effect-dependencies` (duplicates `react-hooks/exhaustive-deps`), `react/memo-dependencies`, and `react/no-deriving-state-in-effects`. The whole family is also off in test and e2e files, where probe components legitimately capture render state into outer variables.

`config` and `gating` have no native port and `component-hook-factories` was not ported, so those three checks are gone.

Also enable type-aware linting via `options.typeAware`, which activates the 59 typescript-eslint rules that need a type checker. This requires the new `oxlint-tsgolint` peer dependency (the `7.x` line targets TypeScript 7); without it oxlint silently skips those rules rather than failing. Type-dependent rules are turned off for `.js`, `.jsx`, `.mjs`, and `.cjs` files, which sit outside the tsconfig program where every expression resolves to `any`.

TypeScript 7 is now a peer dependency, and `options.typeCheck` is on, so oxlint reports TypeScript compiler diagnostics alongside lint findings in a single stream and a separate `tsc --noEmit` step becomes optional. `tsc` is still required wherever it emits, and oxlint labels `typeCheck` experimental.

tsgolint carries its own TypeScript 7 checker. On a repo still on TypeScript 6 that surfaces upgrade work early rather than reporting anything false: against a TypeScript 6 package whose own `tsc` exits clean, every diagnostic oxlint reported was reproduced exactly, same codes and positions, by real TypeScript 7 `tsc`. Set `options: { typeCheck: false }` in your own config to opt out.

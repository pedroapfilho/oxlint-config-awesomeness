---
title: 'Fallow reports dependencies used only through import.meta.resolve as unused'
severity: 'minor'
issue: 'pedroapfilho/oxlint-config-awesomeness#89'
---

## Expected Behavior

`pnpm fallow:dead` counts `import.meta.resolve("<package>")` as a use of `<package>`.

## Current Behavior

`src/index.ts` loads its ESLint plugins with `import.meta.resolve("<package>")`, because oxlint resolves bare plugin specifiers from the consumer's root. Fallow does not see those calls and reports `@nkzw/eslint-plugin`, `eslint-plugin-no-only-tests`, and `eslint-plugin-perfectionist` as unused dependencies.

## Possible Solution

Teach Fallow to treat `import.meta.resolve` string arguments as dependency references, then delete `ignoreDependencies` from `.fallowrc.json`.

## Minimal Reproducible Example

Delete `ignoreDependencies` from `.fallowrc.json` and run `pnpm fallow:dead`.

## Context

The hand-maintained `ignoreDependencies` list drifts: every plugin added or removed needs an edit there too, and the list would hide a plugin that is genuinely unused.

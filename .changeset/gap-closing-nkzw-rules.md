---
"oxlint-config-awesomeness": minor
---

Close the rule gap against nkzw-tech/oxlint-config with five additions:

- `@nkzw/require-use-effect-arguments` (error) — require an explicit dependency array on `useEffect`; new `@nkzw/eslint-plugin` peer dependency. The plugin's other rules (`ensure-relay-types`, `no-instanceof`) stay off.
- `import/export` (error) — duplicate or ambiguous exports; nursery-classified in oxlint, so enabled by name.
- `unicorn/no-magic-array-flat-depth` (error) — no bare numbers as `.flat()` depth.
- `perfectionist/sort-interfaces` (error) — sorted interface members in the `.d.ts`/ambient files where interfaces still appear.
- `no-unused-vars` now ignores `_`-prefixed variables and arguments (`argsIgnorePattern`/`varsIgnorePattern: "^_"`).

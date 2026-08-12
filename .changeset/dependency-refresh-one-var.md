---
"oxlint-config-awesomeness": minor
---

Dependency refresh and the rules that came with it. **Requires oxlint >= 1.78** (peer range bumped from 1.75): older oxlint fails to parse the config because it does not know the `one-var` rule.

- oxlint 1.75 -> 1.78: pins the new `one-var` style rule to `"never"` (one declaration per variable). Without the pin, oxlint's upstream default would error on every consecutive `const` demanding comma-combined declarations. Also newly active through categories: `oxc/bad-match-all-arg` (correctness: `matchAll` without the global flag throws) and `node/exports-style` (style: `module.exports` over the `exports` alias).
- oxlint-plugin-react-doctor 0.9.6 -> 0.9.11: no rule additions or renames, false-positive reductions in effect cleanup detection.
- eslint-plugin-perfectionist 5.9 -> 5.10.1: no new rules, sorting fixes.
- Tooling: @changesets/cli 3, fallow 3, oxfmt 0.63, lint-staged 17.3, vitest 4.1.10.

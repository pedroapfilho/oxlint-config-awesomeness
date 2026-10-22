---
"oxlint-config-awesomeness": minor
---

Replace `eslint-plugin-unused-imports` with the import fix built into oxlint's `no-unused-vars`. Both rules reported every unused import, so each one showed up twice. Now `no-unused-vars` reports it once and `--fix` still deletes it.

`eslint-plugin-unused-imports` is no longer a peer dependency and can be uninstalled. If your own config sets `unused-imports/no-unused-imports`, delete that entry: oxlint rejects rules from a plugin it does not load. A disable comment naming the rule becomes an unused-directive warning.

---
"oxlint-config-awesomeness": patch
---

Sync the vendored anti-slop plugin to upstream commit 13909c9. The existing rules behave the same. The new `anti-slop/require-readable-spacing` rule stays off, because blank-line padding is formatting and oxfmt owns it. The bundle now carries ESLint Stylistic code, so its MIT license ships as `anti-slop/LICENSE-eslint-stylistic`.

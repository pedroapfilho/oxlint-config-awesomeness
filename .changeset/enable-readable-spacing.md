---
"oxlint-config-awesomeness": minor
---

Enable `anti-slop/require-readable-spacing` as an error. It asks for blank lines around multi-line statements, control flow and documented declarations, and its autofix only inserts blank lines, so after upgrading run `oxlint --fix` once, then your formatter.

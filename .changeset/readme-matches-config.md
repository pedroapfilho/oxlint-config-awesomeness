---
"oxlint-config-awesomeness": patch
---

Correct the README. It drops the 103 sections for rules the config does not run, every rule the config turns off is listed with its reason, the override table matches the config, and the headline says its count is of rules enabled by name. The config itself is unchanged. The init template is now exported as `oxlint-config-awesomeness/template`, which the CLI resolves instead of a path relative to `dist/`.

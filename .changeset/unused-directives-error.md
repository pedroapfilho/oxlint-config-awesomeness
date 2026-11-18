---
"oxlint-config-awesomeness": minor
---

Report unused disable directives as errors, and turn `anti-slop/no-unknown-parameters` off.

A directive that no longer suppresses anything now fails the lint. After upgrading, run `oxlint --fix` once: it deletes them, including the `anti-slop/no-unknown-parameters` suppressions this release makes unused.

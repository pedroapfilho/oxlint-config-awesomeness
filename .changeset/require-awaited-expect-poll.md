---
"oxlint-config-awesomeness": minor
---

Enable `vitest/require-awaited-expect-poll` in test files. An `expect.poll` that is not awaited or returned never runs its assertion, so the test passes whatever the code does.

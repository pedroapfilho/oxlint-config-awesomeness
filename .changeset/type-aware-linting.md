---
"oxlint-config-awesomeness": minor
---

Support oxlint type-aware linting (tsgolint stable) and oxlint 1.75.

- Tune type-aware rules for fleet use: `prefer-readonly-parameter-types` and `unbound-method` off globally; the unsafe-`any` family, `no-unsafe-type-assertion`, and `strict-boolean-expressions` relaxed for test files, e2e harnesses, and config files.
- Pin `react/function-component-definition` to arrow components (new in oxlint 1.75 categories; the default demands `function` declarations).
- Scaffold template now enables `typeAware` and `typeCheck`.
- Requires oxlint >= 1.75; consumers opt into type-aware linting by installing `oxlint-tsgolint` alongside.

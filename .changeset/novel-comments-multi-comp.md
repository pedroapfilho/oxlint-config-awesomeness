---
"oxlint-config-awesomeness": minor
---

Two additions against narrative slop and grab-bag files:

- New first-party `awesomeness` plugin (shipped at the `oxlint-config-awesomeness/awesomeness` subpath) with `awesomeness/no-novel-comments` at error: flags any block comment or contiguous run of line comments longer than 5 lines. Directive comments (`eslint-`, `oxlint-`, `@ts-`, and similar) and license headers are exempt.
- `react/no-multi-comp` at error: one React component per file, stateless included. Stories keep their existing exemption; test files are now exempt too, since inline provider wrappers and mock components are test idiom.

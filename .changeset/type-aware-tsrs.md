---
"oxlint-config-awesomeness": major
---

Run type-aware linting through `tsrs` instead of `oxlint-tsgolint`. The `oxlint-tsgolint` peer dependency is replaced by `tsrs`, and `oxlint` must be 1.94 or later, the first release that picks `tsrs` up. Replace `oxlint-tsgolint` with `tsrs` in your devDependencies, and add the installed `tsrs` version to `trustPolicyExclude` if your `pnpm-workspace.yaml` sets `trustPolicy: no-downgrade`.

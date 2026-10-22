---
"oxlint-config-awesomeness": minor
---

Resolve every JS plugin from this package with `import.meta.resolve`, as `@nkzw/oxlint-config` 2.0.1 does. Oxlint resolves a bare plugin specifier from the project root, and pnpm does not link a package's dependencies there. In repos that never installed the ESLint plugins themselves, oxlint found them only through the `NODE_PATH` that pnpm's `.bin/oxlint` shim sets, so running oxlint any other way failed with `Failed to load JS plugin: @nkzw/eslint-plugin`.

`@nkzw/eslint-plugin`, `eslint-plugin-no-only-tests`, `eslint-plugin-perfectionist`, and `eslint` move from peer dependencies to dependencies, so each release ships with the plugin versions its rule list was tested against. If you installed any of them only for this config, remove them from your `package.json`. `oxlint-plugin-react-doctor` stays a peer dependency.

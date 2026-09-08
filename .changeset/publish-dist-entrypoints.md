---
"oxlint-config-awesomeness": patch
---

Publish the config, first-party plugin, type declarations, and CLI from an untracked `dist/` directory instead of committing generated entrypoints. Public imports and CLI behavior stay the same; the package builds before packing and CI builds before running checks.

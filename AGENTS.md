Guidance for AI coding agents working in `oxlint-config-awesomeness`. `CLAUDE.md` is a symlink to this file.

## What This Repo Is

`oxlint-config-awesomeness` is the shared oxlint configuration for managed repositories. `src/index.ts` defines a single default `OxlintConfig` object. The build writes the package contract to `index.js` and `index.d.ts`.

This is a **flat single-package repo**.

## Zero-Behavior-Change Policy

For infrastructure PRs that do not intentionally change the config source, the published runtime config MUST remain identical. `pnpm check:generated` must pass so generated entrypoints cannot drift from `src/index.ts`.

- `index.js`, `index.d.ts`, `awesomeness/index.js`, and `bin/init.js` are generated package entrypoints. Never edit them directly; edit `src/index.ts`, `src/awesomeness.ts`, and `src/init.ts` instead.
- `bin/template.ts` must remain byte-for-byte identical.

The `ignorePatterns` in `.oxfmtrc.json` must exclude generated entrypoints and CLI files explicitly.

## Scripts

| Script                  | What it does                            |
| ----------------------- | --------------------------------------- |
| `pnpm build`            | Generate package entrypoints            |
| `pnpm typecheck`        | Type-check the config source            |
| `pnpm check:generated`  | Reject stale generated entrypoints      |
| `pnpm lint`             | Run oxlint on this repo                 |
| `pnpm format`           | Format with oxfmt                       |
| `pnpm format:check`     | Check formatting (CI)                   |
| `pnpm check:readme`     | Check README rule counts and severities |
| `pnpm test`             | Run vitest smoke tests                  |
| `pnpm test:coverage`    | Run tests with coverage                 |
| `pnpm fallow`           | Run Fallow                              |
| `pnpm fallow:dead`      | Dead-code scan (CI gate)                |
| `pnpm fallow:dupes`     | Duplicate-code scan                     |
| `pnpm fallow:health`    | Dependency health score                 |
| `pnpm fallow:audit`     | Audit changes against main              |
| `pnpm changeset`        | Open a new changeset                    |
| `pnpm version-packages` | Bump versions from pending changesets   |
| `pnpm release`          | Publish to npm via Changesets           |
| `pnpm prepare`          | Install Git hooks                       |

## Release Flow

Releases use Changesets (not tag-push):

1. `pnpm changeset` — describe the change and select semver bump
2. Commit the `.changeset/*.md` file and push
3. The `Release` workflow opens a "Version Packages" PR that bumps `package.json` and `CHANGELOG.md`
4. Merging that PR triggers publish with npm provenance (requires `NPM_TOKEN` secret in the repo)

The old tag-push flow (`v*` tag → `pnpm publish`) has been replaced by this workflow.

## Consumed By

Managed repositories import this config through their pnpm update cycle. Major and minor changes require a Changeset entry.

## Conventions

- Single `package.json` at root — no workspace
- `src/index.ts` is the config source; `index.js` and `index.d.ts` are generated
- `src/awesomeness.ts` is the first-party plugin source; `awesomeness/index.js` is generated. It must ship as JS because oxlint loads plugins with a plain `import()` and Node refuses to type-strip files under `node_modules`
- `src/init.ts` is the CLI source; `bin/init.js` is generated. It scaffolds `oxlint.config.ts` in user repos via `npx oxlint-config-awesomeness init`
- `bin/template.ts` is the file it copies
- `index.test.js` is the smoke test — not in `files`, not published
- Lint/format/test/fallow run in CI; release is managed by Changesets action

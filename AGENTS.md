Guidance for AI coding agents working in `oxlint-config-awesomeness`. `CLAUDE.md` is a symlink to this file.

## What This Repo Is

`oxlint-config-awesomeness` is the shared oxlint configuration for managed repositories. It exports a single default `OxlintConfig` object built with `defineConfig`.

This is a **flat single-package repo**.

## Zero-Behavior-Change Policy

For any infrastructure PR (tooling, CI, configs, release flow), the published files MUST remain byte-for-byte identical to their previous version:

- `index.js` — the exported config object
- `index.d.ts` — the type declaration
- `bin/init.js` — the CLI scaffolder
- `bin/template.ts` — the config template it copies

Never reformat, lint-fix, or otherwise edit these four files. The `ignorePatterns` in `.oxfmtrc.json` and any lint overrides must exclude them explicitly.

## Scripts

| Script                  | What it does                            |
| ----------------------- | --------------------------------------- |
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
- `index.js` is the published config; `index.d.ts` is its type shim
- `bin/init.js` scaffolds `oxlint.config.ts` in user repos via `npx oxlint-config-awesomeness init`
- `bin/template.ts` is the file it copies
- `index.test.js` is the smoke test — not in `files`, not published
- Lint/format/test/fallow run in CI; release is managed by Changesets action

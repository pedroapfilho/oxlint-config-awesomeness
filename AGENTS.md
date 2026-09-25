Guidance for AI coding agents working in `oxlint-config-awesomeness`. `CLAUDE.md` is a symlink to this file.

## What This Repo Is

`oxlint-config-awesomeness` is the shared oxlint configuration for managed repositories. `src/index.ts` defines a single default `OxlintConfig` object. TypeScript emits the package entrypoints and declarations to the gitignored `dist/` directory, which is included in the npm package.

This is a **flat single-package repo**.

## Zero-Behavior-Change Policy

For infrastructure PRs that do not intentionally change the config source, the published runtime config MUST remain identical. Run `pnpm build` before linting, tests, README checks, and Fallow. `pnpm check:generated` compares the current `dist/` files with a fresh temporary build and must pass.

- `dist/index.js`, `dist/index.d.ts`, `dist/awesomeness.js`, `dist/shadcn.js`, and `dist/init.js` are generated package entrypoints. Never edit or commit build outputs; edit `src/index.ts`, `src/awesomeness.ts`, `src/shadcn.ts`, and `src/init.ts` instead.
- `bin/template.ts` must remain byte-for-byte identical.

The `ignorePatterns` in `.oxfmtrc.json` must exclude generated entrypoints and CLI files explicitly.

## Scripts

| Script                  | What it does                            |
| ----------------------- | --------------------------------------- |
| `pnpm build`            | Generate package entrypoints in `dist/` |
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
- `src/index.ts` is the config source; `dist/index.js` and `dist/index.d.ts` are generated
- `src/awesomeness.ts` is the first-party plugin source; `dist/awesomeness.js` is generated. It must ship as JS because oxlint loads plugins with a plain `import()` and Node refuses to type-strip files under `node_modules`
- `src/shadcn.ts` is the opt-in shadcn/ui preset (`oxlint-config-awesomeness/shadcn`); `dist/shadcn.js` is generated. `@shadcn/lint` is an optional peer dependency because only repos that extend the preset load it
- `src/init.ts` is the CLI source; `dist/init.js` is generated. It scaffolds `oxlint.config.ts` in user repos via `npx oxlint-config-awesomeness init`
- `bin/template.ts` is the file it copies
- `anti-slop/index.js` is a committed vendored bundle; `pnpm build` does not regenerate it
- Package exports keep the public imports stable while resolving first-party code from `dist/`
- `index.test.js` is the smoke test — not in `files`, not published
- CI and the pre-commit hook build before checking; `prepack` builds before publishing through Changesets

## Design-system linting

Run `pnpm lint` after changes and fix every error. `oxlint.config.ts` extends the `oxlint-config-awesomeness/shadcn` preset, which registers `@shadcn/lint` and enforces all six rules as errors: component contracts, known Tailwind classes, static component class names, semantic colors, theme or scale values, and class-based styling. Use CSS custom properties for runtime geometry and named theme tokens for custom values. Use component variants for appearance and layout classes at call sites. All six rules also apply inside primitive directories. Shared styles belong to component variants or the owning stylesheet. Keep theme discovery local to each app. Exact class-merging fixture allowances apply only to the named test files.

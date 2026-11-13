Guidance for AI coding agents working in `oxlint-config-awesomeness`. `CLAUDE.md` is a symlink to this file.

## Friction Log

- Log papercuts and friction (tooling, docs, APIs, tests, conventions) as you hit them with `npx frog log`.
- Do not add global, system, or internal friction.
- Run `npx frog list` first to see what is already known.

Entries live in `.agents/friction-log/`, one directory each. A GitHub Action reports them as issues and deletes the entry once the issue closes, so anything still in that directory is still outstanding.

## Standards

This repo follows the fleet's shared standards, checked by `standy` (`~/dev/standy`).

- Before editing, run `standy standards --for <paths>` for the rules that apply to the files you will touch.
- Before finishing, run `standy check --changed --fix-hints` and fix what fails. It only sees tracked files, so run `git add -N` on new files first.
- When a failure is unclear, `standy explain <rule>` prints what the rule asserts, why, and how to fix it.

## What This Repo Is

`oxlint-config-awesomeness` is the shared oxlint configuration for managed repositories. `src/index.ts` defines a single default `OxlintConfig` object. TypeScript emits the package entrypoints and declarations to the gitignored `dist/` directory, which is included in the npm package.

This is a **flat single-package repo**.

## Zero-Behavior-Change Policy

For infrastructure PRs that do not intentionally change the config source, the published runtime config MUST remain identical. Check it by building `main` and the branch and deep-comparing the default exports of `dist/index.js` and `dist/shadcn.js`, with the checkout path replaced in the `jsPlugins` specifiers and key order ignored.

- `dist/` is build output. Every script that reads it builds it first, so never edit or commit it; edit `src/` instead.
- `bin/template.ts` must remain byte-for-byte identical, which is why `.oxfmtrc.json` excludes it.

## Release Flow

Releases use Changesets:

1. `pnpm changeset` — describe the change and select semver bump
2. Commit the `.changeset/*.md` file and push
3. The `Release` workflow opens a "Version Packages" PR that bumps `package.json` and `CHANGELOG.md`
4. Merging that PR publishes to npm through trusted publishing (OIDC), with provenance; the repo holds no npm token

## Consumed By

Managed repositories import this config through their pnpm update cycle. Major and minor changes require a Changeset entry.

## Conventions

- Each `src/*.ts` builds to `dist/*.js` and `dist/*.d.ts`; `package.json` `exports` is the public list, and the package resolves its own files through it
- `src/awesomeness.ts` (the first-party plugin) must ship as JS because oxlint loads plugins with a plain `import()` and Node refuses to type-strip files under `node_modules`
- `@shadcn/lint` is an optional peer dependency because only repos that extend `src/shadcn.ts` load it
- `src/init.ts` scaffolds `oxlint.config.ts` in user repos (`npx oxlint-config-awesomeness init`) by copying `bin/template.ts`, which it finds through the `./template` export
- `src/lint-astro.ts` is the `lint-astro` bin the blogs and the Astro theme run: it lints tracked `.astro` templates through ESLint with the config `src/astro.ts` builds from the repo's `oxlint.config.ts`. It imports `src/typescript6.ts` first, because typescript-eslint cannot load TypeScript 7. The two parsers and `@typescript/typescript6` are optional peer dependencies, like `@shadcn/lint`
- `anti-slop/index.js` is a committed vendored bundle; `pnpm build` does not regenerate it. Its header records the upstream commit and the esbuild command that produced it, and upstream's third-party licenses ship beside it
- Tests sit next to the code they cover and are not published. Unit tests import the source; tests that import `oxlint-config-awesomeness` or spawn its CLI exercise the built package
- `pnpm readme` writes the README's generated regions (between `<!-- name:start -->` and `<!-- name:end -->`) from `src/index.ts` and the installed oxlint: one section per rule the config runs with its severity, File-Type Overrides, Disabled by Intent, the plugin list and the headline. `pnpm check:readme` fails when they are stale. Written by hand: a rule section's description and example, and a plugin's description
- In `src/index.ts`, the comment directly above a rule or an override is its reason, and the README prints it for an override, a rule that is off and a rule that warns. A comment followed by a blank line is a heading for the source only. `pnpm readme` fails on an override or an off rule with no reason

## Design-system linting

Run `pnpm lint` after changes and fix every error. `oxlint.config.ts` extends the `oxlint-config-awesomeness/shadcn` preset, which registers `@shadcn/lint` and enforces all six rules as errors: component contracts, known Tailwind classes, static component class names, semantic colors, theme or scale values, and class-based styling. Use CSS custom properties for runtime geometry and named theme tokens for custom values. Use component variants for appearance and layout classes at call sites. All six rules also apply inside primitive directories. Shared styles belong to component variants or the owning stylesheet. Keep theme discovery local to each app. Exact class-merging fixture allowances apply only to the named test files.

# Open decisions

Choices about this package that nobody has made yet. Each entry says what the code does today, what a change would alter for the repos that install the package, the options, and what to check first. Remove an entry when it is decided.

Counts of "managed repos" are from their default branches on 2026-11-13.

## Three react-doctor rules are stricter here than upstream

**Today.** `src/index.ts` enables the react-doctor rules at the severity the plugin gives them, with three exceptions that are `error` here and `warn` upstream:

- `react-doctor/no-nested-component-definition`: a component defined inside another component, so React recreates it and drops its state on every parent render.
- `react-doctor/no-adjust-state-on-prop-change`: an effect that adjusts state after a prop changes.
- `react-doctor/query-destructure-result`: spreading a whole TanStack Query result, which subscribes to every field.

They have been `error` since the plugin was adopted. Each carries a comment saying so, which is what lets `src/react-doctor.test.js` pass.

**Why it is open.** The config says it follows upstream severities, and these three do not. Moving them to `warn` means a new violation no longer fails a consumer's lint. No managed repo suppresses any of the three, so nothing changes for existing code either way.

**Options.**

1. Keep them at `error` and replace each comment with the reason the rule deserves it. Recommended: every managed repo already passes at `error`, so it costs nothing, and going to `warn` only loosens the check. The first rule is a real bug, not advice.
2. Align all three to `warn`. The config then has no severity of its own in the react-doctor block, and a plugin upgrade is the only thing that can change one. It is a behaviour change, so it needs a changeset.

**Check first.** Nothing. To recount the suppressions in a consumer: `git grep -nE "disable.*react-doctor/(no-nested-component-definition|no-adjust-state-on-prop-change|query-destructure-result)"`.

**Afterwards.** With option 2 the three comments go. With option 1 they become reasons instead of history.

## Two react-doctor rules are left out with no recorded reason

**Today.** `src/react-doctor.test.js` accounts for every rule the installed plugin exports. Two of the rules it leaves out by name carry `no reason was recorded`: `duplicate-jsx-subtree` and `no-high-complexity-react-function`. Both are `warn` upstream and on by default there.

**Why it is open.** Enabling either adds warnings in every consumer. Leaving them out without a reason means the next person cannot tell a choice from an oversight.

**Options.**

1. `duplicate-jsx-subtree`: upstream marks it `execution: "project"`, like the dead-code rules it ships off, so it probably does nothing when oxlint runs it one file at a time. Recommended: confirm that, then record it as the reason.
2. `no-high-complexity-react-function`: enable it at `warn`, or leave it out because the managed repos already run fallow's complexity gate. Recommended: measure first, and enable it only if what it reports is not what fallow already reports.

**Check first.** In one React consumer, set both rules to `"warn"` in its `oxlint.config.ts` and run:

```sh
pnpm exec oxlint . --format=json | jq '[.diagnostics[].code] | map(select(test("duplicate-jsx-subtree|no-high-complexity-react-function"))) | group_by(.) | map({(.[0]): length}) | add'
```

**Afterwards.** The `NO_REASON` constant in `src/react-doctor.test.js` goes.

## The shadcn plugin warns about an old `cn` and the lint still passes

**Today.** The `oxlint-config-awesomeness/shadcn` preset (`src/shadcn.ts`) registers `@shadcn/lint`, and `lint-astro` (`src/lint-astro.ts`) runs the same plugin over Astro templates. For each linted file the plugin resolves the `cn` package from that file's directory. If the copy it finds is older than 0.3.2, it prints this once and checks classes against its own bundled 0.3.2 grammar:

```
[@shadcn/lint] This project's cn is 0.2.6. The linter's grammar needs cn 0.3.2 or later, so it used its bundled cn 0.3.2 instead.
```

Both `oxlint` and `lint-astro` then exit 0. It happens in a workspace that hoists dependencies when the hoisted `cn` is the old one the `shadcn` CLI depends on, while the package that owns the components declares a newer one. The Astro theme's lint prints it on every run.

**Why it is open.** The lint passes while checking classes against a grammar that is not the one the app merges with, and nothing fails. Making it fail changes what the `lint-astro` bin does, which is part of the published contract.

**Options.**

1. Leave it as a warning. Nothing breaks, and the message stays in the logs where nobody reads it.
2. Fix it where `cn` is resolved: the consumer declares `cn` at the workspace root, at the version its components use, and the README's shadcn section states the requirement. Nothing changes in this package's code. Recommended.
3. Make `lint-astro` exit 1 when the plugin prints the warning. It means reading another package's log output, and `oxlint` would still pass on the same repo. Not recommended.

**Check first.** Which consumers print it: `pnpm lint 2>&1 | grep '@shadcn/lint'` in each repo that extends the preset.

**Afterwards.** With option 2 the warning disappears and there is nothing to build here.

## `strict-void-return` rejects `promisify(execFile)`

**Today.** `@typescript-eslint/strict-void-return` is on at `error` through the `pedantic` category. It reports `await promisify(execFile)(...)`, the form Node documents, because `execFile` returns a `ChildProcess`. Writing the promise by hand then trips `@typescript-eslint/prefer-promise-reject-errors`, which does not read `ExecFileException` as an `Error`. So `src/lint-astro.ts` builds the promise by hand and wraps the error in a new `Error` with `cause`. The friction entry is `.agents/friction-log/20261112221150-strict-void-return/`, mirrored as [issue 104](https://github.com/pedroapfilho/oxlint-config-awesomeness/issues/104).

**Why it is open.** Both look like false positives in oxlint-tsgolint, and neither is reported there. Relaxing either rule in the config would do it for every consumer.

**Options.**

1. Keep both rules as they are, write the promise by hand where it comes up, and report both cases to oxlint-tsgolint with the example from the friction entry. Recommended: no managed repo suppresses `strict-void-return`, and only one calls `promisify` on a child-process function.
2. Turn `strict-void-return` down to `warn` or off. Every consumer loses the check for the cases it is right about, such as an async function passed where a void callback is expected.

**Check first.** Whether upstream agrees these are bugs. That is the report itself.

**Afterwards.** Once tsgolint accepts both forms, the hand-written promise in `src/lint-astro.ts` becomes `promisify(execFile)` and the friction entry closes.

## Two warnings are waiting to become errors

**Today.** `src/index.ts` keeps two rules at `warn` for reasons that were meant to be temporary:

- `awesomeness/require-disable-reason` has a `shortcut:` comment: warn while the managed repos still carry unexplained disable directives, error once they are clean. Nothing checks that condition.
- `anti-slop/no-shape-in-symbol-names` warns because it matches any identifier containing "shape". The case that made it noisy, zod's `schema.shape`, is no longer reported: the vendored rule skips member names.

**Why it is open.** Promoting either to `error` fails the lint of every consumer that still has one warning from it.

**Options.**

1. Promote each rule once its count across the consumers is zero. Recommended for `require-disable-reason`, since that is the condition its comment already states.
2. For `no-shape-in-symbol-names`, promote it if the remaining hits are names somebody chose, or keep `warn` and write the reason that still holds.
3. Leave both at `warn` and delete the `shortcut:` comment, which then promises nothing.

**Check first.** The warning count in each consumer:

```sh
pnpm exec oxlint . --format=json | jq '[.diagnostics[].code] | map(select(. == "awesomeness(require-disable-reason)" or . == "anti-slop(no-shape-in-symbol-names)")) | group_by(.) | map({(.[0]): length}) | add'
```

No managed repo suppresses either rule inline.

**Afterwards.** The `shortcut:` comment goes, and so do two "Warn, not error" notes in the README, which `pnpm readme` rewrites.

## Some overrides match no file in any managed repo

**Today.** `src/index.ts` relaxes rules for a few file names. Across the 27 managed repos:

| Glob                             | What it relaxes                 | Files    |
| -------------------------------- | ------------------------------- | -------- |
| `**/*.stories.ts(x)`             | `no-console`                    | none     |
| `**/.storybook/**`               | the config-file rules           | none     |
| `**/migrate.ts`, `**/migrate.js` | `no-console`                    | none     |
| `**/middleware.ts(.js)`          | `unicorn/prefer-string-raw` off | none     |
| `**/proxy.ts(.js)`               | `unicorn/prefer-string-raw` off | 11 repos |
| `**/seed.ts(.js)`                | `no-console`                    | 8 repos  |

**Why it is open.** The first four exist for code nobody here has. But the package is public on npm, and removing a glob turns the rule back on for anyone outside who has those files. Next.js projects before version 16 still name the file `middleware.ts`.

**Options.**

1. Keep them. They cost nothing at lint time and each states a real fact about a framework. Recommended.
2. Remove the four unused globs in the next major release. It saves about ten lines and leaves the config describing only what the managed repos ship.

**Check first.** Whether anyone outside the managed repos installs the package: its dependents and weekly downloads on npm.

**Afterwards.** With option 2 the Storybook override and five other globs go, and the README's File-Type Overrides list shrinks with them.

## `main` and the untyped `./awesomeness` export in `package.json`

**Today.** `package.json` has `"main": "./dist/index.js"`, which repeats `exports["."]`. The `./awesomeness` export is a bare path with no `types` condition, although `dist/awesomeness.d.ts` ships. The other JavaScript exports all carry `types`.

**Why it is open.** `main` is what resolves the package for tools that ignore `exports`, such as TypeScript with `moduleResolution: node10`. Removing it breaks them, so it is a major change. Adding `types` to `./awesomeness` is additive, but it changes the exports map for a file that only oxlint loads, by its specifier.

**Options.**

1. Leave both until the next major release, then make the manifest exports-only with `types` on every JavaScript export. Recommended: neither is worth a release of its own.
2. Add `types` to `./awesomeness` now, as a patch, and drop `main` at the next major.
3. Keep `main` for good. It costs one line.

**Check first.** Nothing. `publint --strict` and `attw` run in CI and report the result of either change.

**Afterwards.** One line of the manifest goes and every JavaScript export has the same shape.

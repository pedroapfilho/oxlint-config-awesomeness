---
title: 'Committing only friction-log entries fails the pre-commit hook'
severity: 'minor'
issue: 'pedroapfilho/oxlint-config-awesomeness#91'
---

## Expected Behavior

A commit that adds only `.agents/friction-log/*/friction.md` entries passes the pre-commit hook.

## Current Behavior

lint-staged hands the staged `friction.md` files to `oxfmt`, but `.oxfmtrc.json` ignores `.agents/friction-log/**`. With every target ignored, oxfmt exits 2 with `Expected at least one target file. All matched files may have been excluded by ignore rules.`, and the commit is rejected. A commit that also stages a formattable file passes, because oxfmt then has a target.

## Possible Solution

Run lint-staged's formatter as `oxfmt --no-error-on-unmatched-pattern`, which exits 0 when all targets are ignored and still fails on real format issues. standy's `tooling/lint-staged-runs-oxfmt` currently requires the command to be exactly `oxfmt`, so the standard needs to allow the flag first.

## Minimal Reproducible Example

`pnpm frog log <title> --body <body>`, then `git add .agents/friction-log && git commit -m test`.

## Context

No friction entry had been committed in this repository before, so every first entry hits this. The entries in this commit were committed with `--no-verify`; the hook had nothing to check in them.

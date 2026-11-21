---
title: '`strict-void-return` rejects `promisify(execFile)`'
severity: 'minor'
issue: 'pedroapfilho/oxlint-config-awesomeness#104'
---

## Expected Behavior

`await promisify(execFile)("git", ["ls-files"])` lints clean. It is the form Node documents for awaiting a child process.

## Current Behavior

`typescript/strict-void-return` reports `Value-returning function used in a context where a void function is expected` on the `execFile` argument, because `execFile` returns a `ChildProcess`. Typing the result as `typeof execFile.__promisify__` does not help. The explicit `new Promise` form then trips `typescript/prefer-promise-reject-errors`, because `ExecFileException` is an intersection of `Omit` types that the rule does not read as an `Error`, so the rejection has to wrap it in a new `Error` with `cause`.

## Possible Solution

Report both upstream against oxlint-tsgolint. Until then, code under `src/` that spawns a process writes the promise by hand, as `src/lint-astro.ts` does. `node/no-sync` is off only under `bin/`, `scripts/` and `tools/`, so `execFileSync` is not an option there.

## Minimal Reproducible Example

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const { stdout } = await promisify(execFile)("git", ["ls-files"]);
```

## Context

Hit while moving the blogs' Astro template lint runner into this package as the `lint-astro` bin.

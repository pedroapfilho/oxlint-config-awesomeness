---
title: 'pnpm install warns about an unmet TypeScript peer of @typescript-eslint/parser'
severity: 'minor'
issue: 'pedroapfilho/oxlint-config-awesomeness#90'
---

## Expected Behavior

`pnpm install` finishes without peer warnings, like the other `@typescript-eslint/*` TypeScript 7 mismatches that `pnpm-workspace.yaml` already allows.

## Current Behavior

Every `pnpm install` ends with `Issues with peer dependencies found`. `pnpm peers check` shows `@typescript-eslint/parser@8.70.0`, pulled in by the `@shadcn/lint` dev dependency, wants `typescript >=4.8.4 <6.1.0` while the repo installs TypeScript 7.

## Possible Solution

Add `"@typescript-eslint/parser>typescript": "7"` to `peerDependencyRules.allowedVersions` in `pnpm-workspace.yaml`.

## Minimal Reproducible Example

`pnpm install && pnpm peers check`

## Context

A permanent known warning hides any new peer problem behind it.

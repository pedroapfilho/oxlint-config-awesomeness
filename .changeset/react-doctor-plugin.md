---
"oxlint-config-awesomeness": minor
---

Add `oxlint-plugin-react-doctor` as a fifth JS-bridge plugin: 158 curated React Doctor diagnostic rules (state-and-effects, re-render performance, RSC/server, Next.js App Router, TanStack Query, Zod v4, bundle size, design) from the upstream `recommended` + `next` + `tanstack-query` presets at upstream severities. The a11y/react-builtins port buckets and six native-nextjs duplicates are excluded — oxlint's native plugins already cover them. Verified against acme and dashfoo: zero error-level hits on existing fleet code, warnings only.

---
"oxlint-config-awesomeness": patch
---

Turn off `react-doctor/query-mutation-missing-invalidation`.

The rule only scans the `useMutation` options object literal for a
`queryClient.invalidateQueries`-style call, so a mutation that invalidates
through a named hook (`onSuccess: invalidateWallets`) is reported as missing
invalidation. Extracting invalidation into a hook is the idiomatic React Query
pattern, and the rule cannot follow any indirection, so it fires on correct
code while staying silent on the bug that actually bites (a mismatched
`queryKey`). `oxlint-plugin-react-doctor` 0.9.x resolves the callback through
scope and no longer misreports this; the rule can come back when this config
moves off 0.5.x.

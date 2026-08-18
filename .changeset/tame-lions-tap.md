---
"oxlint-config-awesomeness": minor
---

Tune rules the managed repos were overriding anyway, based on an audit of 505 inline suppressions and 90 config-level disables across 9 repos.

`no-await-in-loop` is now off. It assumes loop bodies are independent and should be parallelised, but the dominant patterns in these codebases are inherently sequential: cursor pagination, rate-limited fan-out, and retry backoff. It was suppressed 105 times across 7 repos and disabled outright in 6, and every justification sampled was legitimate. `react-doctor/async-await-in-loop` still warns on the genuinely parallelisable cases, so the advisory survives.

The CLI override (`**/bin/**`, `scripts/**`) now also covers `tools/**`, and turns off the type-assertion family, `@typescript-eslint/no-unsafe-type-assertion`, and `require-unicode-regexp` there. One-shot scripts parse their own local JSON output, where a schema at the boundary is ceremony.

Config files additionally turn off `node/no-sync` and `require-unicode-regexp`; test files turn off the same two. Both were disabled in 7 to 8 of 9 repos, in consistently the same places.

Nothing that catches real bugs was weakened. `no-unsafe-type-assertion` stays on outside one-shot scripts: it is the most suppressed rule in the fleet, but 52 of 58 sampled suppressions carry a written justification, which is the rule working rather than failing.

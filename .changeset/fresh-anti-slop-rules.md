---
"oxlint-config-awesomeness": minor
---

Update the vendored anti-slop plugin to upstream `95a56e5` and enable its two new rules, `no-array-filter-map` and `no-reduce-accumulator-copy`, as errors. Existing rules pick up upstream's tightened diagnostics and alias resolution; the local member-property exemption in `no-shape-in-symbol-names` is now upstream and was dropped from the bundle.

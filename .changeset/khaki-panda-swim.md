---
"oxlint-config-awesomeness": minor
---

Replace `react/no-multi-comp` with `react-doctor/no-multi-component-file` (new in react-doctor 0.9.12) at `warn`.

The native rule flagged any file declaring more than one component, which hit every shadcn primitive family, so this config had it turned off. The react-doctor rule only fires when the extra components are **not exported**, meaning they are secondary components hiding in a file rather than a published family. Verified against the fleet: it leaves `card.tsx` and `accordion.tsx` alone (7 and 4 exported components) and flags a file that declares 7 and exports only the compound object.

The `react/no-multi-comp: "off"` entry is gone, since the rule is not in any category this config enables and the new rule documents the position.

Bump `oxlint-plugin-react-doctor` to 0.9.12 and `fallow` to 3.17.0. The other 96 rules new in 0.9.12 are Three.js and React Three Fiber, which stay off: no managed repo ships either.

import type { OxlintConfig } from "oxlint";
import { defineConfig } from "oxlint";

// Design-system rules for shadcn/ui projects, opted into alongside the base
// config: `extends: [awesomeness, shadcn]`. Needs `@shadcn/lint` installed.
// Repos with per-component exceptions redefine `shadcn/no-restyle` with their
// own `contracts`; a later rule setting replaces this one.
const shadcn: OxlintConfig = defineConfig({
  jsPlugins: ["@shadcn/lint"],
  rules: {
    // Arbitrary values on appearance utilities (`p-[13px]`) bypass the theme scale.
    "shadcn/no-arbitrary-values": "error",
    // Inline `style` bypasses class-based styling; CSS custom properties are exempt.
    "shadcn/no-inline-styles": "error",
    // Raw palette colors (`bg-red-500`) instead of theme tokens (`bg-destructive`).
    "shadcn/no-raw-colors": "error",
    // Call sites may position a component; its appearance belongs to its variants.
    "shadcn/no-restyle": ["error", { allow: ["layout"] }],
    // Tailwind generates no CSS for a class it does not know.
    "shadcn/no-unknown-classes": "error",
    // The other rules can only check a `className` they can read statically.
    "shadcn/require-static-classes": "error",
  },
});

export default shadcn;

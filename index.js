import { defineConfig } from "oxlint";

export default defineConfig({
  // Bulk-enable oxlint categories as errors.
  // `restriction` is intentionally excluded — oxlint docs warn against enabling it as a whole
  // since those rules forbid valid language features. We cherry-pick restriction rules below.
  categories: {
    // Outright bugs: unreachable code, constant conditions, invalid regex, etc.
    correctness: "error",
    // Style nitpicks that routinely prevent real bugs (strict booleans, unsafe any, etc.).
    pedantic: "error",
    // Patterns with measurable runtime cost.
    perf: "error",
    // Non-functional consistency — deterministic, no judgement calls.
    style: "error",
    // Code that's probably wrong but not provably so.
    suspicious: "error",
  },
  env: {
    browser: true,
    builtin: true,
    es2024: true,
    node: true,
  },
  // JS-plugin bridge for ESLint plugins oxlint doesn't yet implement natively.
  jsPlugins: [
    "eslint-plugin-no-only-tests",
    "eslint-plugin-perfectionist",
    "eslint-plugin-unused-imports",
    // React Compiler's own lint rules — stricter than classic react-hooks;
    // enforce the purity/memoization/gating invariants the compiler needs.
    { name: "react-hooks-js", specifier: "eslint-plugin-react-hooks" },
  ],
  overrides: [
    // TypeScript files — turn off rules the TS compiler already enforces via its type system.
    // Running them again would be pure overhead and occasionally produce false positives.
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
      rules: {
        // TS enforces `super()` requirements via class hierarchy checks.
        "constructor-super": "off",
        // TS catches missing returns via the function's declared return type.
        "getter-return": "off",
        // Class bindings are const in TS — reassignment is a compile error.
        "no-class-assign": "off",
        // `const` bindings can't be reassigned — TS catches this.
        "no-const-assign": "off",
        // Duplicate class members produce a TS compile error.
        "no-dupe-class-members": "off",
        // Duplicate object keys are reported by TS.
        "no-dupe-keys": "off",
        // Function declarations are const-bound in TS.
        "no-func-assign": "off",
        // Imports are read-only bindings — TS catches reassignment.
        "no-import-assign": "off",
        // TS signatures prevent calling non-constructors with `new`.
        "no-new-native-nonconstructor": "off",
        // `Math()` / `JSON()` aren't callable per TS lib types.
        "no-obj-calls": "off",
        // Redeclaration is a TS compile error.
        "no-redeclare": "off",
        // TS enforces setter signatures must not return values.
        "no-setter-return": "off",
        // TS catches `this` before `super()` in derived constructors.
        "no-this-before-super": "off",
        // TS resolves all references — unresolved identifiers fail to compile.
        "no-undef": "off",
        // TS reports unreachable code as a diagnostic.
        "no-unreachable": "off",
        // TS narrows operators; `!a instanceof B` becomes a type error.
        "no-unsafe-negation": "off",
        // `with` statements aren't allowed in strict mode or TS at all.
        "no-with": "off",
        // Not type-checked by TS — prefer `...args` over `arguments`.
        "prefer-rest-params": "error",
        // Not type-checked by TS — prefer spread over `.apply()`.
        "prefer-spread": "error",
      },
    },
    // Test files — relax strict rules that generate noise in mocks, fixtures, describe blocks.
    {
      files: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/__tests__/**",
      ],
      rules: {
        // Mocks are commonly typed `any` for speed.
        "@typescript-eslint/no-explicit-any": "off",
        // Fixtures chain `!` + `??` for narrowing.
        "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "off",
        // Fixtures narrow via `!` on known-populated test data.
        "@typescript-eslint/no-non-null-assertion": "off",
        // `jest.mock` / `vi.mock` factories use `require()`.
        "@typescript-eslint/no-require-imports": "off",
        // Mocks don't carry type info.
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        // Legacy `var x = require(...)` still appears in older test setups.
        "@typescript-eslint/no-var-requires": "off",
        // Mock implementations may return bare promises without `async`.
        "@typescript-eslint/promise-function-async": "off",
        // Test utilities can legitimately form small local cycles.
        "import/no-cycle": "off",
        // `describe`/`it` blocks legitimately exceed size limits.
        "max-lines": "off",
        "max-lines-per-function": "off",
        "max-nested-callbacks": "off",
        "max-statements": "off",
        // Empty test stubs are valid placeholders.
        "no-empty": "off",
        // Empty mock implementations are common.
        "no-empty-function": "off",
        // Test helpers are often defined after the `describe` that uses them.
        "no-use-before-define": "off",
      },
    },
    // Storybook stories — component documentation has its own idioms.
    {
      files: ["**/*.stories.ts", "**/*.stories.tsx"],
      rules: {
        // `console.log` is a valid teaching tool in stories.
        "no-console": "off",
        // Stories legitimately export multiple component variants.
        "react/no-multi-comp": "off",
      },
    },
    // Seed and migration scripts — one-shot CLI tools with log output.
    {
      files: ["**/seed.ts", "**/seed.js", "**/migrate.ts", "**/migrate.js"],
      rules: {
        // CLI tools print progress to stdout.
        "no-console": "off",
      },
    },
    // CLI entry points — `process.exit` and console output are the whole point.
    {
      files: ["**/bin/**", "scripts/**"],
      rules: {
        "no-console": "off",
        "unicorn/no-process-exit": "off",
      },
    },
    // Config files — build tooling is allowed anonymous defaults and long files.
    {
      files: [
        "*.config.ts",
        "*.config.js",
        "*.config.mjs",
        "*.config.mts",
        "**/.storybook/**",
        "vitest.config.*",
        "playwright.config.*",
        "tailwind.config.*",
        "postcss.config.*",
        "next.config.*",
      ],
      rules: {
        // Tool configs are traditionally `export default {...}` with no name.
        "import-x/no-anonymous-default-export": "off",
        // Big configs (webpack, next) routinely exceed 400 lines.
        "max-lines": "off",
      },
    },
    // Playwright/Cypress E2E fixtures — test harness code, not React components.
    {
      files: ["**/e2e/**/fixtures/**", "**/e2e/**/*.ts"],
      rules: {
        // Playwright fixtures use hook-like names (`test.extend`) that trip the rule.
        "react-hooks/rules-of-hooks": "off",
      },
    },
  ],
  plugins: [
    "typescript",
    "import",
    "react",
    "unicorn",
    "jsx-a11y",
    "promise",
    "nextjs",
    "oxc",
    "node",
  ],
  rules: {
    // TypeScript — custom options

    // Prefer `Array<T>` over `T[]` — generic form scales to complex element types
    // (`Array<() => void>` vs `(() => void)[]`) without extra parentheses.
    "@typescript-eslint/array-type": ["error", { default: "generic" }],
    // Force `type` over `interface` — `type` supports unions/intersections/mapped types
    // and can't be accidentally merged via declaration merging.
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],

    // Core eslint — custom options

    // Prevent duplicate import statements but still allow separating type-only imports
    // from value imports (`import type { X } from 'x'; import { y } from 'x';`).
    "eslint/no-duplicate-imports": [
      "error",
      { allowSeparateTypeImports: true },
    ],
    // Require the `v` flag on regex literals — opts into Unicode-aware matching with set notation.
    "eslint/require-unicode-regexp": ["error", { requireFlag: "v" }],
    // Block `@nocommit` markers from reaching main — a hard stop for WIP code.
    "no-warning-comments": ["error", { terms: ["@nocommit"] }],

    // Restriction — core eslint (cherry-picked from the 90 rules in `restriction`)

    // Always use braces — prevents the dangling-else bug and ambiguous single-line bodies.
    curly: "error",
    // Require a `default` case in switch — forces explicit handling of unknown values.
    "default-case": "error",
    // Ban `==` — type coercion is the single largest source of surprise in JS.
    eqeqeq: "error",
    // Keep get/set pairs adjacent — readers expect them together.
    "grouped-accessor-pairs": "error",
    // One class per file — keeps files focused and imports unambiguous.
    "max-classes-per-file": ["error", { max: 1 }],
    // Cap nesting at 4 — deeper usually means an extraction is overdue.
    "max-depth": ["error", { max: 4 }],
    // 400-line ceiling (comments + blanks excluded) — force splitting by concern.
    "max-lines": [
      "error",
      { max: 400, skipBlankLines: true, skipComments: true },
    ],
    // Deeply nested callbacks are a refactor smell — convert to async/await or extract.
    "max-nested-callbacks": ["error", { max: 3 }],
    // More than 4 positional params → pass an options object for readability.
    "max-params": ["error", { max: 4 }],
    // `alert()` is never production UI — use a toast/modal primitive.
    "no-alert": "error",
    // `.caller`/`.arguments.callee` are deprecated and strict-mode errors.
    "no-caller": "error",
    // Ship with a real logger, not `console.*` — overrides above allow CLIs/stories.
    "no-console": "error",
    // Empty blocks are either a forgotten TODO or a logic bug.
    "no-empty": "error",
    // Banned as a security + performance anti-pattern; defeats static analysis.
    "no-eval": "error",
    // Mutating `Array.prototype` etc. breaks every library that trusts the globals.
    "no-extend-native": "error",
    // Be explicit with conversions — `Number(x)` over `+x`, except `!!x` (idiomatic).
    "no-implicit-coercion": ["error", { allow: ["!!"] }],
    // Runtime code generation from strings — same security and performance issues as dynamic exec.
    "no-new-func": "error",
    // `new String/Number/Boolean(...)` creates boxed objects that fail `===`.
    "no-new-wrappers": "error",
    // Prefer `{}` literal over `new Object()`.
    "no-object-constructor": "error",
    // Params are inputs, not locals — reassigning them hides the original value.
    "no-param-reassign": "error",
    // `__proto__` is deprecated — use `Object.getPrototypeOf`.
    "no-proto": "error",
    // `return a = b` looks like a typo for `==`.
    "no-return-assign": "error",
    // `javascript:` URLs are XSS vectors.
    "no-script-url": "error",
    // Shadowing outer-scope names hides bugs during refactors.
    "no-shadow": "error",
    // Always throw `Error` objects — literals have no stack trace.
    "no-throw-literal": "error",
    // Catch TDZ bugs from using `let`/`const` before their declaration.
    "no-use-before-define": "error",
    // `var` has function scope — use `let`/`const` (block-scoped).
    "no-var": "error",
    // Allow `void promise` to explicitly ignore a floating promise — a real pattern.
    "no-void": ["error", { allowAsStatement: true }],
    // Reject promises with `Error` instances so stack traces survive.
    "prefer-promise-reject-errors": "error",
    // Template literals > string concatenation — fewer escape/coercion bugs.
    "prefer-template": "error",

    // Restriction — TypeScript
    // Highest-leverage rules for AI-generated code: they block the escape hatches
    // (`any`, `!`, `require`) that AI reaches for when it can't figure out the right type.

    // `delete obj[dynamicKey]` is usually a type-lie — the key may not be optional.
    "@typescript-eslint/no-dynamic-delete": "error",
    // `{}` means "any non-nullish value" — almost never what people mean.
    "@typescript-eslint/no-empty-object-type": "error",
    // The #1 AI tell. Use `unknown` + narrowing or a real type.
    "@typescript-eslint/no-explicit-any": "error",
    // Ensure `import type` has no runtime side effects — keeps bundles clean.
    "@typescript-eslint/no-import-type-side-effects": "error",
    // `void` only makes sense as a return type or a generic constraint.
    "@typescript-eslint/no-invalid-void-type": "error",
    // `x! ?? fallback` is always a bug — the `!` already asserts non-null.
    "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
    // Non-null `!` lies to the checker. Narrow properly or throw explicitly.
    "@typescript-eslint/no-non-null-assertion": "error",
    // Use ESM `import` — `require()` breaks tree-shaking and type inference.
    "@typescript-eslint/no-require-imports": "error",
    "@typescript-eslint/no-var-requires": "error",
    // Promise-returning functions must be `async` — guarantees thrown errors become rejections.
    "@typescript-eslint/promise-function-async": "error",
    // `.catch((err) => ...)` — `err` should be `unknown`, not `any` (strict TS behavior).
    "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",

    // Restriction — React

    // `<button>` defaults to `type="submit"` — silently submits enclosing forms. Must be explicit.
    "react/button-has-type": "error",
    // Raw HTML insertion in JSX is an XSS vector — require a deliberate opt-out.
    "react/no-danger": "error",
    // Catches typos like `class=` or `tabindex=` in JSX.
    "react/no-unknown-property": "error",

    // Restriction — import graph

    // Circular imports produce `undefined` exports at runtime — a real-world crash source.
    "import/no-cycle": "error",

    // Restriction — unicorn (modern JS + anti-escape-hatch)

    // Blanket `// eslint-disable` without a rule name is the universal AI escape hatch.
    "unicorn/no-abusive-eslint-disable": "error",
    // Direct `document.cookie` access — use a cookie library for encoding/security.
    "unicorn/no-document-cookie": "error",
    // `process.exit()` skips `finally` blocks and async flushes. CLI override above handles CLIs.
    "unicorn/no-process-exit": "error",
    // `Math.trunc(x)` over `x | 0` — clearer intent, correct for numbers outside Int32 range.
    "unicorn/prefer-modern-math-apis": "error",
    // `import { fs } from 'node:fs'` — the `node:` prefix disambiguates from npm packages.
    "unicorn/prefer-node-protocol": "error",
    // `Number.isNaN(x)` over `isNaN(x)` — the global coerces strings before checking.
    "unicorn/prefer-number-properties": "error",

    // Restriction — promise / node

    // Callback-style APIs: always handle the `err` argument.
    "node/handle-callback-err": "error",
    // `new require(...)` is meaningless — require is a function, not a constructor.
    "node/no-new-require": "error",
    // String-concatenating paths breaks on Windows — use `path.join`.
    "node/no-path-concat": "error",
    // Every promise chain must end with `.catch()` or `return` — unhandled rejections are silent bugs.
    "promise/catch-or-return": "error",

    // Restriction — a11y

    // "click here", "read more", "link" — ambiguous link text fails screen readers.
    "jsx-a11y/anchor-ambiguous-text": "error",

    // Disabled — incompatible with React 17+ JSX transform and common composition patterns

    // Three-way deadlock: `[v, setV]` trips `no-unused-vars` if setter unused;
    // `[v, _setV]` trips this rule's strict `[thing, setThing]` naming;
    // `[v]` trips this rule's "must destructure both" requirement.
    // TypeScript already catches setter-name typos via type errors, so the value is low.
    "react/hook-use-state": "off",
    // JSX depth is constrained by composition, not by a magic number.
    "react/jsx-max-depth": "off",
    // React Compiler (`react-hooks-js`) handles memoization — no need to pre-extract context values.
    "react/jsx-no-constructed-context-values": "off",
    // Prop spreading is a valid composition pattern with proper types.
    "react/jsx-props-no-spreading": "off",
    // Static lists have stable indices — false positives outweigh real catches.
    "react/no-array-index-key": "off",
    // React 17+ automatic JSX runtime — no import needed.
    "react/react-in-jsx-scope": "off",

    // Disabled — import rules that fight modern ESM / legitimate patterns

    // Mixing `import type` styles in one project is fine.
    "import/consistent-type-specifier-style": "off",
    // "Exports at end" is style preference, not correctness.
    "import/exports-last": "off",
    // Side-effect imports (CSS, polyfills) must come first — conflicts with this rule.
    "import/first": "off",
    // Grouping exports isn't meaningful with named exports.
    "import/group-exports": "off",
    // Dependency count caps don't catch real problems.
    "import/max-dependencies": "off",
    // Anonymous default exports are normal in configs and utilities.
    "import/no-anonymous-default-export": "off",
    // Named exports are the modern ESM norm.
    "import/no-named-export": "off",
    // `import * as Sentry from '@sentry/node'` is the canonical API for Sentry/Prisma/etc.
    "import/no-namespace": "off",
    // Node built-ins (`node:fs`) are legitimate in Node code.
    "import/no-nodejs-modules": "off",
    // Side-effect imports for CSS and polyfills are required.
    "import/no-unassigned-import": "off",
    // Modern codebases prefer named exports; default exports are the exception.
    "import/prefer-default-export": "off",

    // Disabled — pedantic style preferences that fight day-to-day clarity

    // Block bodies are sometimes clearer (breakpoints, multi-statement arrows).
    "arrow-body-style": "off",
    // Capitalization of comments is noise.
    "capitalized-comments": "off",
    // Anonymous arrows are canonical in modern code.
    "func-names": "off",
    // Mixing declarations and expressions is a project's call.
    "func-style": "off",
    // `i`, `x`, `n` are fine in small scopes.
    "id-length": "off",
    // `let x; ... x = compute();` is a real pattern.
    "init-declarations": "off",
    // Too blunt — well-factored functions can still be long.
    "max-lines-per-function": "off",
    // Too blunt — modern async code has many statements by design.
    "max-statements": "off",
    // `continue` is often clearer than extra nesting.
    "no-continue": "off",
    // Explicit types on simple assignments is a style choice, not an error.
    "no-inferrable-types": "off",
    // Inline `// ...` comments are sometimes the clearest option.
    "no-inline-comments": "off",
    // Too noisy — most numbers in UI code have obvious meaning.
    "no-magic-numbers": "off",
    // `if (!done)` is often clearer than `if (done === false)`.
    "no-negated-condition": "off",
    // Ternaries are fine in expressions.
    "no-ternary": "off",
    // TS parameter properties (`constructor(private x: T)`) are a valid shorthand.
    "parameter-properties": "off",
    // Destructuring isn't always clearer — `arr[0]` can be better than `const [first] = arr`.
    "prefer-destructuring": "off",

    // Disabled — unicorn rules that overreach into legitimate patterns

    // Over-prescribes a specific custom-error shape.
    "unicorn/custom-error-definition": "off",
    // Escape-case fights non-English strings and regex literals.
    "unicorn/escape-case": "off",
    // `if (arr.length)` is a valid idiom for "has elements".
    "unicorn/explicit-length-check": "off",
    // `.map(fn)` is the canonical callback pattern.
    "unicorn/no-array-callback-reference": "off",
    // `forEach` is fine for side effects.
    "unicorn/no-array-for-each": "off",
    // `reduce` is fine — the rule is ideological, not mechanical.
    "unicorn/no-array-reduce": "off",
    // Nested ternaries are sometimes the clearest expression.
    "unicorn/no-nested-ternary": "off",
    // `return undefined` is sometimes explicit and intentional.
    "unicorn/no-useless-undefined": "off",
    // `1.0` can signal "this is a floating-point value" in domain code.
    "unicorn/no-zero-fractions": "off",
    // `window` and `self` are fine in clearly-browser code.
    "unicorn/prefer-global-this": "off",

    // Disabled — raw Promise constructors and callbacks stay idiomatic for adapters

    // `new Promise` is required when wrapping event emitters, streams, or callback APIs.
    "promise/avoid-new": "off",
    // `(resolve, reject)` is the idiomatic parameter naming.
    "promise/param-names": "off",
    // Event emitters and streams are callback-based and stay that way.
    "promise/prefer-await-to-callbacks": "off",

    // Style overrides — handled deterministically by perfectionist/oxfmt
    "sort-imports": "off",
    "sort-keys": "off",
    "sort-vars": "off",

    // Unicorn — filename-case

    // kebab-case matches the CLAUDE.md convention, with exceptions for:
    // - Next.js dynamic routes: `[slug].tsx`, `[...catchAll].tsx`
    // - Next.js special files: `_app.tsx`, `_document.tsx`
    "unicorn/filename-case": [
      "error",
      {
        case: "kebabCase",
        ignore: [String.raw`\[.*\]`, "^_.*"],
      },
    ],
    // `null` is a legitimate, distinct value — don't force `undefined` everywhere.
    "unicorn/no-null": "off",

    // Perfectionist — deterministic sorting keeps diffs stable and review-friendly

    // Enums sorted by value make intent + ordering obvious; partitionByComment preserves groupings.
    "perfectionist/sort-enums": [
      "error",
      { partitionByComment: true, sortByValue: "always" },
    ],
    // `class Foo extends A, B` — alphabetical for stable diffs.
    "perfectionist/sort-heritage-clauses": "error",
    // JSX prop order is a huge diff-noise source — sort it.
    "perfectionist/sort-jsx-props": "error",
    // Type fields sorted alphabetically for scannability.
    "perfectionist/sort-object-types": "error",
    // Object keys alphabetical; partitionByComment preserves intentional grouping.
    "perfectionist/sort-objects": ["error", { partitionByComment: true }],

    // React Compiler (react-hooks-js) — enforce the invariants the compiler needs
    // to safely auto-memoize your components.

    // Hooks can't be created inside components — they must be module-level.
    "react-hooks-js/component-hook-factories": "error",
    // Validates the plugin's own config shape.
    "react-hooks-js/config": "error",
    // Error boundaries have specific invariants the compiler respects.
    "react-hooks-js/error-boundaries": "error",
    // Feature-flag gating must be consistent so the compiler can reason about it.
    "react-hooks-js/gating": "error",
    // No global mutation during render — breaks compiler's purity assumptions.
    "react-hooks-js/globals": "error",
    // Don't mutate props or state — compiler assumes immutability.
    "react-hooks-js/immutability": "error",
    // Flags libraries the compiler can't safely optimize around.
    "react-hooks-js/incompatible-library": "error",
    // If you wrote `useMemo`/`useCallback`, keep them — the compiler preserves your intent.
    "react-hooks-js/preserve-manual-memoization": "error",
    // Render must be pure — no side effects, no I/O, no randomness.
    "react-hooks-js/purity": "error",
    // Refs belong in effects and handlers, not render.
    "react-hooks-js/refs": "error",
    // Setting state inside an effect must be carefully guarded.
    "react-hooks-js/set-state-in-effect": "error",
    // Never set state during render — infinite loop.
    "react-hooks-js/set-state-in-render": "error",
    // Prefer static component definitions over dynamic factories.
    "react-hooks-js/static-components": "error",
    // Syntax (decorators, specific private-field patterns) the compiler can't analyze.
    "react-hooks-js/unsupported-syntax": "error",
    // Enforces the modern `useMemo` shape the compiler expects.
    "react-hooks-js/use-memo": "error",

    // React hooks — the classic rules, still necessary even with the compiler

    // Dependency array must include every value referenced in the effect.
    "react-hooks/exhaustive-deps": "error",
    // Hooks only at the top level, only from React functions — never in conditions/loops.
    "react-hooks/rules-of-hooks": "error",

    // Testing

    // `.only()` in a test file skips every other test — must never land on main.
    "no-only-tests/no-only-tests": "error",

    // Unused imports

    // Dead imports bloat bundles and mislead readers — remove them.
    "unused-imports/no-unused-imports": "error",
  },
});

/* oxlint-disable max-lines -- the config source is deliberately one flat,
   greppable file; splitting it into modules would obscure the rule inventory. */
import type { OxlintConfig } from "oxlint";
import { defineConfig } from "oxlint";

const UNSAFE_ANY_OFF = {
  "@typescript-eslint/no-unsafe-argument": "off",
  "@typescript-eslint/no-unsafe-assignment": "off",
  "@typescript-eslint/no-unsafe-call": "off",
  "@typescript-eslint/no-unsafe-member-access": "off",
  "@typescript-eslint/no-unsafe-return": "off",
  "@typescript-eslint/no-unsafe-type-assertion": "off",
} as const;

const ASSERTION_FAMILY_OFF = {
  "anti-slop/no-chained-type-assertions": "off",
  "anti-slop/no-known-value-widening": "off",
  "anti-slop/no-unknown-type-aliases": "off",
  "anti-slop/no-unsafe-dictionary-type": "off",
  "anti-slop/no-widen-then-assert": "off",
  "anti-slop/require-safety-comment-for-type-assertion": "off",
} as const;

// Test components are throwaway probes that capture render state into outer
// variables. They are never compiled for production, so the compiler's
// invariants do not apply to them.
const REACT_COMPILER_OFF = {
  "react/error-boundaries": "off",
  "react/globals": "off",
  "react/immutability": "off",
  "react/incompatible-library": "off",
  "react/preserve-manual-memoization": "off",
  "react/purity": "off",
  "react/refs": "off",
  "react/set-state-in-effect": "off",
  "react/set-state-in-render": "off",
  "react/static-components": "off",
  "react/unsupported-syntax": "off",
  "react/use-memo": "off",
  "react/void-use-memo": "off",
} as const;

const config: OxlintConfig = defineConfig({
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
    // React Doctor diagnostics (security, perf, correctness, RSC, TanStack Query).
    { name: "react-doctor", specifier: "oxlint-plugin-react-doctor" },
    // Anti-slop: rejects low-evidence TypeScript patterns. Vendored into this
    // package (anti-slop/index.js) because upstream is source-distributed and
    // not on npm yet; the specifier resolves via this package's exports map.
    { name: "anti-slop", specifier: "oxlint-config-awesomeness/anti-slop" },
    // First-party rules that ship with this config (awesomeness/index.js).
    { name: "awesomeness", specifier: "oxlint-config-awesomeness/awesomeness" },
  ],
  // Type-aware linting via tsgolint (stable since oxlint-tsgolint v7). Turns on
  // the 59 typescript-eslint rules that need a type checker; the `@typescript-eslint`
  // entries below stop being no-ops. Requires `oxlint-tsgolint` installed.
  //
  // `typeCheck` routes TypeScript compiler diagnostics through the linter too, so
  // one oxlint run reports type errors and lint errors in one format. That single
  // stream is the point: it is what automated fixers consume. It also reuses the
  // program tsgolint already built, which is cheaper than a second `tsc` process.
  // Requires TypeScript 7, since tsgolint carries its own TypeScript 7 checker.
  options: {
    typeAware: true,
    typeCheck: true,
  },
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
    // JavaScript files: type-aware rules see no types here. A `.js` file outside
    // the tsconfig program resolves every expression to `any`, so the rules that
    // report on `any` fire on every line. Rules needing a known type (such as
    // no-floating-promises) simply stay quiet, which is the correct outcome.
    {
      files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
      rules: {
        ...UNSAFE_ANY_OFF,
        // Needs a resolved return type to tell void from value.
        "@typescript-eslint/no-confusing-void-expression": "off",
        // Every condition is `any` without types.
        "@typescript-eslint/strict-boolean-expressions": "off",
        "@typescript-eslint/strict-void-return": "off",
      },
    },
    // Test files — relax strict rules that generate noise in mocks, fixtures, describe blocks.
    {
      files: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
      rules: {
        ...UNSAFE_ANY_OFF,
        ...ASSERTION_FAMILY_OFF,
        ...REACT_COMPILER_OFF,
        // Mocks are commonly typed `any` for speed.
        "@typescript-eslint/no-explicit-any": "off",
        // Fixtures chain `!` + `??` for narrowing.
        "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "off",
        // Fixtures narrow via `!` on known-populated test data.
        "@typescript-eslint/no-non-null-assertion": "off",
        // `jest.mock` / `vi.mock` factories use `require()`.
        "@typescript-eslint/no-require-imports": "off",
        // Legacy `var x = require(...)` still appears in older test setups.
        "@typescript-eslint/no-var-requires": "off",
        // Mock implementations may return bare promises without `async`.
        "@typescript-eslint/promise-function-async": "off",
        // Test utilities can legitimately form small local cycles.
        "import/no-cycle": "off",
        // `describe`/`it` blocks legitimately exceed size limits.
        "max-lines": "off",
        "max-nested-callbacks": "off",
        // Fixtures read files from disk; sync fs keeps setup readable.
        "node/no-sync": "off",
        // Throwaway matching in assertions does not need the `v` flag.
        "require-unicode-regexp": "off",
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
      files: ["**/bin/**", "scripts/**", "tools/**"],
      rules: {
        ...ASSERTION_FAMILY_OFF,
        "no-console": "off",
        // One-shot CLI tools run sequentially; sync fs is the simpler, correct choice.
        "node/no-sync": "off",
        // One-shot scripts parse their own local JSON output; a schema at that
        // boundary is ceremony when the producer is the same script.
        "@typescript-eslint/no-unsafe-type-assertion": "off",
        "require-unicode-regexp": "off",
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
        // Config files branch on optional env vars (`if (process.env.CI)`);
        // spelling out the nullish/empty cases there is ceremony, not safety.
        "@typescript-eslint/strict-boolean-expressions": "off",
        // Big configs (webpack, next) routinely exceed 400 lines.
        "max-lines": "off",
        // Build config reads files at startup; sync fs is correct there.
        "node/no-sync": "off",
        // Throwaway matching in build config does not need the `v` flag.
        "require-unicode-regexp": "off",
      },
    },
    // Playwright/Cypress E2E fixtures — test harness code, not React components.
    {
      files: ["**/e2e/**/fixtures/**", "**/e2e/**/*.ts"],
      rules: {
        ...UNSAFE_ANY_OFF,
        ...ASSERTION_FAMILY_OFF,
        ...REACT_COMPILER_OFF,
        // Harness code branches on optional env vars (`if (process.env.CI)`).
        "@typescript-eslint/strict-boolean-expressions": "off",
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
    "eslint/no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
    // Require the `v` flag on regex literals — opts into Unicode-aware matching with set notation.
    "eslint/require-unicode-regexp": ["error", { requireFlag: "v" }],
    // Block `@nocommit` markers from reaching main — a hard stop for WIP code.
    "no-warning-comments": ["error", { terms: ["@nocommit"] }],
    // Lives in `style`, which we bulk-enable, so it needs an explicit "off" —
    // deleting this line would restore the upstream default ("always"), which
    // demands comma-combined declarations.
    "one-var": "off",

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
    "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
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
    "@typescript-eslint/promise-function-async": ["error", { checkArrowFunctions: false }],
    // `.catch((err) => ...)` — `err` should be `unknown`, not `any` (strict TS behavior).
    "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",

    // Type-aware (tsgolint) tuning. These rules only run when the consuming
    // repo enables `options.typeAware`; configuring them here is a no-op otherwise.

    // Requires `Readonly<>` on virtually every object/array parameter and fights
    // React, Playwright, and Hono signatures. Upstream keeps it out of every preset.
    "@typescript-eslint/prefer-readonly-parameter-types": "off",
    // Fires on idiomatic destructuring of library hooks (`const { push } = useRouter()`)
    // because their types lack `this: void` annotations; false positives dominate.
    "@typescript-eslint/unbound-method": "off",

    // Restriction — React

    // `<button>` defaults to `type="submit"` — silently submits enclosing forms. Must be explicit.
    "react/button-has-type": "error",
    // Arrow components (`const X = () =>`) are the fleet standard; the rule's
    // default demands `function` declarations, so pin it to arrows explicitly.
    "react/function-component-definition": [
      "error",
      { namedComponents: "arrow-function", unnamedComponents: "arrow-function" },
    ],
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
    // React Compiler handles memoization, so pre-extracting context values is moot.
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
    // Off: the rule assumes loop bodies are independent and should be
    // parallelised, but the dominant patterns here are inherently sequential:
    // cursor pagination, rate-limited fan-out, and retry backoff. Measured
    // across the fleet it was suppressed 105 times and disabled outright in 6
    // repos. `react-doctor/async-await-in-loop` still warns on the rest.
    "no-await-in-loop": "off",
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
    "perfectionist/sort-enums": ["error", { partitionByComment: true, sortByValue: "always" }],
    // `class Foo extends A, B` — alphabetical for stable diffs.
    "perfectionist/sort-heritage-clauses": "error",
    // JSX prop order is a huge diff-noise source — sort it.
    "perfectionist/sort-jsx-props": "error",
    // Type fields sorted alphabetically for scannability.
    "perfectionist/sort-object-types": "error",
    // Object keys alphabetical; partitionByComment preserves intentional grouping.
    "perfectionist/sort-objects": ["error", { partitionByComment: true }],

    // React Compiler: oxlint's native port of the compiler's validation passes
    // (oxlint 1.79+). Replaces the eslint-plugin-react-hooks JS plugin, so the
    // same passes run without a JS bridge and consumers drop a peer dependency.
    // `config` and `gating` have no native port (oxlint fixes those options),
    // and `component-hook-factories` was not ported.

    // Off: oxlint files the next five under enabled categories, but React ships
    // them off in its own presets and each misfires on non-React code. Measured
    // against the fleet: `capitalized-calls` flags schema factories
    // (`onSubmit: SignUpWizardSchema(t)`), `hooks` flags agent DSLs whose
    // functions are named `use*`, and `exhaustive-effect-dependencies` repeats
    // `react-hooks/exhaustive-deps` with worse messages.
    "react/capitalized-calls": "off",
    "react/exhaustive-effect-dependencies": "off",
    "react/hooks": "off",
    "react/memo-dependencies": "off",
    "react/no-deriving-state-in-effects": "off",

    // Error boundaries have specific invariants the compiler respects.
    "react/error-boundaries": "error",
    // No global mutation during render; breaks the compiler's purity assumptions.
    "react/globals": "error",
    // Don't mutate props or state; the compiler assumes immutability.
    "react/immutability": "error",
    // Flags libraries the compiler can't safely optimize around.
    "react/incompatible-library": "error",
    // If you wrote `useMemo`/`useCallback`, keep them; the compiler preserves your intent.
    "react/preserve-manual-memoization": "error",
    // Render must be pure: no side effects, no I/O, no randomness.
    "react/purity": "error",
    // Refs belong in effects and handlers, not render.
    "react/refs": "error",
    // Setting state inside an effect must be carefully guarded.
    "react/set-state-in-effect": "error",
    // Never set state during render; it loops forever.
    "react/set-state-in-render": "error",
    // Prefer static component definitions over dynamic factories.
    "react/static-components": "error",
    // Syntax (decorators, specific private-field patterns) the compiler can't analyze.
    // Lives in the `restriction` category, so it needs enabling by name.
    "react/unsupported-syntax": "error",
    // Enforces the modern `useMemo` shape the compiler expects.
    "react/use-memo": "error",
    // A `useMemo` callback that returns nothing is always a mistake.
    "react/void-use-memo": "error",

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

    // Anti-slop (vendored, see anti-slop/index.js): reject patterns that fake
    // type evidence instead of establishing it, i.e. the assertion/widening
    // escape hatches AI-generated code reaches for beyond plain `any`.

    // `x as unknown as T` launders any value into any type.
    "anti-slop/no-chained-type-assertions": "error",
    // Warn, not error: `...(cond ? { key } : {})` is how an optional key is
    // omitted in Next config objects and Better Auth options, where the
    // alternative (build the object in separate statements) reads worse.
    "anti-slop/no-conditional-empty-object-spread": "warn",
    // Warn, not error: fires on `const X: Record<Union, string> = {...}` lookup
    // tables and on named-shape return annotations, which are deliberate
    // contracts here rather than laundered types. 76 sites across four repos.
    "anti-slop/no-known-value-widening": "warn",
    "anti-slop/no-module-mocking": "error",
    // `object` on inputs accepts nearly everything; name the expected fields.
    "anti-slop/no-object-parameters": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    // Flags every `typeof` unary, including the `typeof window` SSR guards the
    // react-doctor browser-global rules steer toward and ordinary
    // `typeof x === "string"` narrowing. Off until upstream scopes it.
    "anti-slop/no-runtime-typeof": "off",
    // Warn, not error: matches any identifier containing "shape", which hits
    // zod's `schema.shape` introspection API (form resolvers, tRPC).
    "anti-slop/no-shape-in-symbol-names": "warn",
    // Warn, not error: `use-unknown-in-catch-callback-variable` (above) autofixes
    // catch callbacks to `(err: unknown)`, which this rule then flags; upstream
    // only exempts parameters named `cause`.
    "anti-slop/no-unknown-parameters": "warn",
    "anti-slop/no-unknown-returns": "error",
    // `type X = unknown` hides the escape hatch behind a domain-sounding name.
    "anti-slop/no-unknown-type-aliases": "error",
    // Warn, not error: `Record<string, unknown>` is the correct type at a real
    // boundary (structured log context, a recursive deep-merge input), and the
    // rule cannot tell those from a lazy escape hatch.
    "anti-slop/no-unsafe-dictionary-type": "warn",
    // Widening a known value and asserting it back is a two-step type lie.
    "anti-slop/no-widen-then-assert": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "error",

    // Awesomeness: first-party rules shipped with this config.

    // Comments longer than 5 lines narrate instead of inform. Directive
    // comments (eslint-/oxlint-/@ts-) and license headers are exempt.
    //
    // Warn, not error: length is a proxy for narration, and after a comment
    // sweep the long survivors are the load-bearing ones (external-system
    // behavior, e2e helper contracts). Blocking a build on prose is the wrong
    // trade; the warning still surfaces every one of them.
    "awesomeness/no-novel-comments": "warn",

    // React Doctor (react-doctor): original diagnostic rules at upstream severities
    // (warn = advisory, error = definite bug). Excluded on purpose: the ports of
    // oxlint-native react/jsx-a11y/react-hooks rules already enabled above (or
    // deliberately disabled, like no-array-index-key), the six rules the native
    // nextjs plugin already covers, no-eval (core eslint rule is on), and
    // react-compiler-no-manual-memoization (contradicts
    // react/preserve-manual-memoization).
    //
    // The plugin grew 337 -> 787 rules between 0.5 and 0.9 with nothing removed or
    // renamed. Of the 450 additions, the ones enabled below are those whose
    // `requires` stack tokens the fleet actually ships (react, tailwind 4, next 15,
    // ssr, i18n). Left off: rules gated on libraries no repo uses (ink, motion,
    // three/r3f, firebase, supabase, react-router), and the visual-taste bucket
    // described at the Maintainability group.

    // Accessibility: original checks, not the ports excluded above. These cover
    // ground the native jsx-a11y rules do not (Tailwind animation gating, control
    // sizing, landmark and heading structure, focus visibility).
    "react-doctor/anchor-target-exists": "warn",
    "react-doctor/aria-braille-equivalent": "warn",
    "react-doctor/data-table-requires-accessible-name": "warn",
    "react-doctor/details-requires-summary": "warn",
    "react-doctor/dialog-has-accessible-name": "warn",
    "react-doctor/empty-table-header": "warn",
    "react-doctor/fieldset-requires-legend": "warn",
    "react-doctor/html-xml-lang-mismatch": "warn",
    "react-doctor/iframe-title-unique": "warn",
    "react-doctor/loading-action-preserves-trigger": "warn",
    "react-doctor/no-all-caps-body-text": "warn",
    "react-doctor/no-arbitrary-px-font-size": "warn",
    "react-doctor/no-aria-hidden-on-body": "error",
    "react-doctor/no-aria-invalid-without-description": "warn",
    "react-doctor/no-assertive-status": "warn",
    "react-doctor/no-autoplay-without-muted": "warn",
    "react-doctor/no-blocked-paste": "error",
    "react-doctor/no-controlled-selection-focus-effect": "warn",
    "react-doctor/no-cramped-container-padding": "warn",
    "react-doctor/no-crushed-letter-spacing": "warn",
    "react-doctor/no-duplicate-static-id-reference": "error",
    "react-doctor/no-focus-in-animation-completion-handler": "warn",
    "react-doctor/no-focusable-content-in-aria-hidden": "warn",
    "react-doctor/no-focusable-content-in-role-text": "warn",
    "react-doctor/no-hover-only-reveal": "warn",
    "react-doctor/no-inert-pointer-affordance": "warn",
    "react-doctor/no-invalid-progress-range": "error",
    "react-doctor/no-invisible-focus-control": "warn",
    "react-doctor/no-low-contrast-inline-style": "warn",
    // Supersedes the native `react/no-multi-comp`, which flagged any file with
    // more than one component and so hit every shadcn primitive family. This one
    // only fires when the extra components are not exported, meaning they are
    // secondary components hiding in a file rather than a published family.
    "react-doctor/no-multi-component-file": "warn",
    "react-doctor/no-multiple-main-landmarks": "warn",
    "react-doctor/no-multiple-unlabeled-navigation-landmarks": "warn",
    "react-doctor/no-nonresizable-textarea": "warn",
    "react-doctor/no-overwide-text-measure": "warn",
    "react-doctor/no-placeholder-only-field": "warn",
    "react-doctor/no-pointer-disabled-enabled-control": "warn",
    "react-doctor/no-presentation-role-conflict": "warn",
    "react-doctor/no-reduced-motion-content-removal": "warn",
    "react-doctor/no-responsive-hidden-accessible-name": "warn",
    "react-doctor/no-server-side-image-map": "warn",
    "react-doctor/no-skipped-heading-level": "warn",
    "react-doctor/no-small-form-control-text": "warn",
    "react-doctor/no-smooth-scroll-without-reduced-motion": "warn",
    "react-doctor/no-tight-body-leading": "warn",
    "react-doctor/no-transitioned-composite-widget-state": "warn",
    "react-doctor/no-transitioned-focus-ring": "warn",
    "react-doctor/no-undersized-icon-button": "warn",
    "react-doctor/no-ungated-tailwind-animation": "warn",
    "react-doctor/no-uninformative-aria-label": "warn",
    "react-doctor/radio-input-missing-name": "warn",
    "react-doctor/role-button-requires-complete-keyboard-activation": "warn",

    // Architecture — component structure, module boundaries, export hygiene.
    "react-doctor/no-giant-component": "warn",
    "react-doctor/no-legacy-class-lifecycles": "error",
    "react-doctor/no-legacy-context-api": "error",
    "react-doctor/no-many-boolean-props": "warn",
    "react-doctor/no-nested-component-definition": "error",
    "react-doctor/no-react-dom-deprecated-apis": "warn",
    "react-doctor/no-react19-deprecated-apis": "warn",
    "react-doctor/no-render-in-render": "warn",
    "react-doctor/no-render-prop-children": "warn",
    "react-doctor/prefer-explicit-variants": "warn",
    "react-doctor/prefer-module-scope-pure-function": "warn",
    "react-doctor/prefer-module-scope-static-value": "warn",

    // Bugs: runtime defects with a concrete failure mode (hydration mismatches,
    // unguarded parses, effect and listener lifecycle, DOM structure).
    "react-doctor/class-component-missing-component-will-unmount-teardown": "warn",
    "react-doctor/debounce-no-cleanup": "warn",
    "react-doctor/effect-listener-cleanup-mismatch": "error",
    "react-doctor/effect-listener-cleanup-reference-mismatch": "error",
    "react-doctor/effect-observer-needs-disconnect": "error",
    "react-doctor/effect-raf-loop-needs-cancel": "warn",
    "react-doctor/effect-remove-listener-inline-handler": "error",
    "react-doctor/form-control-requires-name": "warn",
    "react-doctor/hook-import-rename-loses-use-prefix": "warn",
    "react-doctor/html-label-has-single-control": "warn",
    "react-doctor/html-no-nested-form": "warn",
    "react-doctor/jsx-numeric-and-leaked-render": "warn",
    "react-doctor/nextjs-async-dynamic-api-not-awaited": "error",
    "react-doctor/nextjs-metadata-url-consistency": "warn",
    "react-doctor/no-arithmetic-on-optional-chained-operand": "warn",
    "react-doctor/no-array-find-result-member-access-without-guard": "warn",
    "react-doctor/no-array-index-deref-without-bounds-or-empty-guard": "warn",
    "react-doctor/no-async-effect-callback": "warn",
    "react-doctor/no-async-event-handler-without-reentry-guard": "warn",
    "react-doctor/no-boolean-toggle-without-functional-update": "warn",
    "react-doctor/no-broken-image-source": "warn",
    "react-doctor/no-call-component-as-function": "warn",
    "react-doctor/no-clipped-overlay": "warn",
    "react-doctor/no-collapse-request-error-to-empty-state": "warn",
    "react-doctor/no-collapsed-literal-or-chain-as-value": "warn",
    "react-doctor/no-controlled-input-value-without-state-update": "warn",
    "react-doctor/no-create-object-url-in-render": "warn",
    "react-doctor/no-create-ref-in-function-component": "warn",
    "react-doctor/no-deprecated-keyboard-event-keycode-which": "warn",
    "react-doctor/no-effect-wrapper-discards-callback-cleanup-return": "warn",
    "react-doctor/no-enter-submit-without-ime-composition-guard": "warn",
    "react-doctor/no-fetch-response-used-without-status-check": "warn",
    "react-doctor/no-fill-map-element-as-key": "warn",
    "react-doctor/no-fixed-inside-transformed-ancestor": "warn",
    "react-doctor/no-floating-then-in-jsx-handler": "warn",
    "react-doctor/no-hydration-branch-on-browser-global": "error",
    "react-doctor/no-impure-call-at-module-scope": "warn",
    "react-doctor/no-impure-state-updater": "error",
    "react-doctor/no-indeterminate-attribute": "warn",
    "react-doctor/no-inert-sticky-position": "warn",
    "react-doctor/no-loading-flag-reset-outside-finally": "warn",
    "react-doctor/no-locale-format-in-render": "warn",
    "react-doctor/no-match-media-in-state-initializer": "warn",
    "react-doctor/no-mixed-srcset-descriptors": "warn",
    "react-doctor/no-mutate-queried-dom-node-in-component": "warn",
    "react-doctor/no-mutate-then-set-or-return-same-reference": "warn",
    "react-doctor/no-mutating-array-method-on-prop-or-hook-result": "warn",
    "react-doctor/no-non-literal-selector-query-without-try-catch": "warn",
    "react-doctor/no-non-null-assertion-on-maybe-undefined-result": "warn",
    "react-doctor/no-nondeterministic-id-value-in-render-body": "warn",
    "react-doctor/no-nullish-coalescing-arithmetic-precedence": "warn",
    "react-doctor/no-object-keys-values-entries-on-maybe-undefined": "warn",
    "react-doctor/no-object-or-array-coerced-to-string-in-template-literal": "warn",
    "react-doctor/no-passive-request-owner-ref": "warn",
    "react-doctor/no-predicate-function-reference-in-boolean-position": "warn",
    "react-doctor/no-promise-then-side-effect-in-effect-without-catch": "warn",
    "react-doctor/no-prop-callback-in-render": "error",
    "react-doctor/no-ref-current-in-render": "error",
    "react-doctor/no-set-state-after-await-in-effect": "warn",
    "react-doctor/no-side-effect-in-state-updater-function": "warn",
    "react-doctor/no-spread-props-over-defaults-clobbers-with-undefined": "warn",
    "react-doctor/no-stale-timer-ref": "warn",
    "react-doctor/no-string-false-on-boolean-attribute": "warn",
    "react-doctor/no-unescaped-dynamic-string-in-regexp": "warn",
    "react-doctor/no-unguarded-browser-global-at-module-scope": "warn",
    // Downgraded from its upstream "error". The rule reports any browser-global
    // read on a render path, but a component behind `dynamic(…, { ssr: false })`
    // and an app with no server render at all are both correct as written, and
    // neither is visible from the file the rule inspects.
    "react-doctor/no-unguarded-browser-global-in-render-or-hook-init": "warn",
    "react-doctor/no-unguarded-numeric-input-parse": "warn",
    "react-doctor/no-unguarded-throwing-parse-call": "warn",
    "react-doctor/no-unowned-async-error-clear": "warn",
    "react-doctor/no-unsafe-json-parse": "warn",
    "react-doctor/no-whole-object-default-losing-per-key-defaults": "warn",
    "react-doctor/no-whole-object-dep-with-member-reads": "warn",
    "react-doctor/pointer-capture-needs-cancel-handler": "warn",
    "react-doctor/shadcn-tabs-trigger-requires-list": "warn",
    "react-doctor/waapi-animation-in-render": "error",
    "react-doctor/web-animation-offsets-valid": "error",

    // Bundle size — heavy imports that bloat client bundles.
    "react-doctor/no-barrel-import": "warn",
    "react-doctor/no-dynamic-import-path": "warn",
    "react-doctor/no-full-lodash-import": "warn",
    "react-doctor/no-moment": "warn",
    "react-doctor/no-undeferred-third-party": "warn",
    "react-doctor/prefer-dynamic-import": "warn",
    "react-doctor/use-lazy-motion": "warn",

    // Client/browser API usage.
    "react-doctor/client-localstorage-no-version": "warn",
    "react-doctor/client-passive-event-listeners": "warn",

    // Correctness — invalid HTML/DOM structure React will render broken.
    "react-doctor/html-no-invalid-paragraph-child": "warn",
    "react-doctor/html-no-invalid-table-nesting": "warn",
    "react-doctor/html-no-nested-interactive": "warn",
    "react-doctor/no-jsx-element-type": "error",
    "react-doctor/no-polymorphic-children": "warn",
    "react-doctor/no-prevent-default": "warn",
    "react-doctor/no-random-key": "error",
    "react-doctor/no-uncontrolled-input": "warn",
    "react-doctor/rendering-conditional-render": "warn",
    "react-doctor/rendering-svg-precision": "warn",

    // Design/UX — visual anti-patterns (focus rings, contrast, transitions).
    "react-doctor/no-disabled-zoom": "error",
    "react-doctor/no-gray-on-colored-background": "warn",
    "react-doctor/no-inline-bounce-easing": "warn",
    "react-doctor/no-inline-exhaustive-style": "warn",
    "react-doctor/no-layout-transition-inline": "warn",
    "react-doctor/no-long-transition-duration": "warn",
    "react-doctor/no-outline-none": "warn",
    "react-doctor/no-tiny-text": "warn",

    // Jotai — no-ops in repos that do not use it.
    "react-doctor/jotai-derived-atom-returns-fresh-object": "warn",
    "react-doctor/jotai-select-atom-in-render-body": "error",
    "react-doctor/jotai-tq-use-raw-query-atom": "warn",

    // JS performance — micro-patterns with measurable render cost.
    "react-doctor/async-await-in-loop": "warn",
    "react-doctor/async-parallel": "warn",
    "react-doctor/js-async-reduce-without-awaited-acc": "warn",
    "react-doctor/js-batch-dom-css": "warn",
    "react-doctor/js-cache-property-access": "warn",
    "react-doctor/js-cache-storage": "warn",
    "react-doctor/js-combine-iterations": "warn",
    "react-doctor/js-early-exit": "warn",
    "react-doctor/js-flatmap-filter": "warn",
    "react-doctor/js-hoist-intl": "warn",
    "react-doctor/js-hoist-regexp": "warn",
    "react-doctor/js-index-maps": "warn",
    "react-doctor/js-length-check-first": "warn",
    "react-doctor/js-min-max-loop": "warn",
    "react-doctor/js-set-map-lookups": "warn",
    "react-doctor/js-tosorted-immutable": "warn",

    // Maintainability: the mechanically-checkable subset. The rest of this bucket
    // upstream is visual-taste detection (decorative orbs, hero eyebrow chips,
    // uniform feature-card grids); those are design calls, not lint findings.
    "react-doctor/no-auto-scrolling-content": "warn",
    "react-doctor/no-deprecated-tailwind-class": "warn",
    "react-doctor/no-dynamic-tailwind-class-fragment": "warn",
    "react-doctor/no-excessive-font-families": "warn",
    "react-doctor/no-inline-hoc-on-component": "warn",
    "react-doctor/no-layout-shifting-interaction-state": "warn",
    "react-doctor/no-mixed-icon-libraries": "warn",
    "react-doctor/no-redundant-display-class": "warn",
    "react-doctor/no-redundant-title-tooltip": "warn",
    "react-doctor/no-svg-currentcolor-with-fill-class": "warn",
    "react-doctor/prefer-tabular-numeric-data": "warn",
    "react-doctor/prefer-truncate-shorthand": "warn",
    "react-doctor/require-autoplay-video-poster": "warn",

    // Runtime performance: DOM, media and animation cost.
    "react-doctor/context-provider-value-from-unmemoized-local-literal": "warn",
    "react-doctor/no-create-object-url-without-revoke": "warn",
    "react-doctor/no-document-write": "warn",
    "react-doctor/no-eager-new-in-use-state-initializer": "warn",
    "react-doctor/no-ease-in-motion": "warn",
    "react-doctor/no-img-lazy-with-high-fetchpriority": "warn",
    "react-doctor/no-img-without-dimensions": "warn",
    "react-doctor/no-json-parse-stringify-clone": "warn",
    "react-doctor/no-spread-accumulator-in-reduce": "warn",
    "react-doctor/no-srcset-without-sizes": "warn",
    "react-doctor/no-sync-xhr": "warn",
    "react-doctor/no-tailwind-layout-transition": "warn",
    "react-doctor/no-unbounded-animation-frame-loop": "warn",
    "react-doctor/no-unthrottled-scroll-mutation": "warn",
    "react-doctor/prefer-motion-transform-property": "warn",

    // Next.js App Router — RSC/route-handler/metadata pitfalls beyond the native nextjs plugin.
    "react-doctor/nextjs-error-boundary-missing-use-client": "error",
    "react-doctor/nextjs-global-error-missing-html-body": "error",
    "react-doctor/nextjs-image-missing-sizes": "warn",
    "react-doctor/nextjs-missing-metadata": "warn",
    "react-doctor/nextjs-no-a-element": "warn",
    "react-doctor/nextjs-no-client-fetch-for-server-data": "warn",
    "react-doctor/nextjs-no-client-side-redirect": "warn",
    "react-doctor/nextjs-no-default-export-in-route-handler": "error",
    "react-doctor/nextjs-no-edge-og-runtime": "warn",
    "react-doctor/nextjs-no-font-link": "warn",
    "react-doctor/nextjs-no-head-import": "error",
    "react-doctor/nextjs-no-native-script": "warn",
    "react-doctor/nextjs-no-redirect-in-try-catch": "warn",
    "react-doctor/nextjs-no-script-in-head": "error",
    "react-doctor/nextjs-no-side-effect-in-get-handler": "error",
    "react-doctor/nextjs-no-use-search-params-without-suspense": "warn",
    "react-doctor/nextjs-no-vercel-og-import": "warn",

    // React performance — re-render and memoization diagnostics.
    "react-doctor/async-defer-await": "warn",
    "react-doctor/no-global-css-variable-animation": "error",
    "react-doctor/no-inline-prop-on-memo-component": "warn",
    "react-doctor/no-large-animated-blur": "warn",
    "react-doctor/no-layout-property-animation": "error",
    "react-doctor/no-permanent-will-change": "warn",
    "react-doctor/no-scale-from-zero": "warn",
    "react-doctor/no-transition-all": "warn",
    "react-doctor/no-usememo-simple-expression": "warn",
    "react-doctor/prefer-stable-empty-fallback": "warn",
    "react-doctor/rendering-animate-svg-wrapper": "warn",
    "react-doctor/rendering-hoist-jsx": "warn",
    "react-doctor/rendering-hydration-mismatch-time": "warn",
    "react-doctor/rendering-hydration-no-flicker": "warn",
    "react-doctor/rendering-script-defer-async": "warn",
    "react-doctor/rendering-usetransition-loading": "warn",
    "react-doctor/rerender-derived-state-from-hook": "warn",
    "react-doctor/rerender-memo-before-early-return": "warn",
    "react-doctor/rerender-memo-with-default-value": "warn",
    "react-doctor/rerender-transitions-scroll": "warn",

    // Security.
    "react-doctor/active-static-asset": "warn",
    "react-doctor/agent-tool-capability-risk": "warn",
    "react-doctor/artifact-baas-authority-surface": "warn",
    "react-doctor/artifact-env-leak": "error",
    "react-doctor/artifact-secret-leak": "error",
    "react-doctor/auth-token-in-web-storage": "warn",
    "react-doctor/build-pipeline-secret-boundary": "warn",
    "react-doctor/clickjacking-redirect-risk": "warn",
    "react-doctor/command-execution-input-risk": "error",
    "react-doctor/cors-cookie-trust-risk": "warn",
    "react-doctor/dangerous-html-sink": "warn",
    "react-doctor/git-provider-url-injection-risk": "warn",
    "react-doctor/import-metadata-execution-risk": "error",
    "react-doctor/insecure-crypto-risk": "warn",
    "react-doctor/insecure-session-cookie": "warn",
    "react-doctor/jwt-insecure-verification": "error",
    "react-doctor/key-lifecycle-risk": "error",
    "react-doctor/local-rpc-native-bridge-risk": "warn",
    "react-doctor/mcp-tool-capability-risk": "warn",
    "react-doctor/mdx-ssr-execution-risk": "warn",
    "react-doctor/no-path-prefix-containment": "warn",
    "react-doctor/no-secrets-in-client-code": "warn",
    "react-doctor/nosql-injection-risk": "warn",
    "react-doctor/package-metadata-secret": "warn",
    "react-doctor/path-traversal-risk": "warn",
    "react-doctor/plugin-update-trust-risk": "warn",
    "react-doctor/postmessage-origin-risk": "warn",
    "react-doctor/public-debug-artifact": "warn",
    "react-doctor/public-env-secret-name": "warn",
    "react-doctor/raw-sql-injection-risk": "warn",
    "react-doctor/react-markdown-unsanitized-raw-html": "warn",
    "react-doctor/repository-secret-file": "error",
    "react-doctor/request-body-mass-assignment": "warn",
    "react-doctor/secret-in-fallback": "error",
    "react-doctor/svg-filter-clickjacking-risk": "warn",
    "react-doctor/tenant-static-proxy-risk": "warn",
    "react-doctor/unsafe-json-in-html": "warn",
    "react-doctor/untrusted-redirect-following": "warn",
    "react-doctor/url-prefilled-privileged-action": "warn",
    "react-doctor/webhook-signature-risk": "warn",
    "react-doctor/window-open-without-noopener": "warn",

    // Server Components / server code.
    "react-doctor/server-after-nonblocking": "warn",
    "react-doctor/server-auth-actions": "error",
    "react-doctor/server-cache-with-object-literal": "warn",
    "react-doctor/server-dedup-props": "warn",
    "react-doctor/server-fetch-without-revalidate": "warn",
    "react-doctor/server-hoist-static-io": "warn",
    "react-doctor/server-no-mutable-module-state": "error",
    "react-doctor/server-sequential-independent-await": "warn",

    // State and effects — the 'You Might Not Need an Effect' family and friends.
    "react-doctor/activity-wraps-effect-heavy-subtree": "warn",
    "react-doctor/advanced-event-handler-refs": "warn",
    "react-doctor/effect-needs-cleanup": "error",
    "react-doctor/hooks-no-nan-in-deps": "warn",
    "react-doctor/no-adjust-state-on-prop-change": "error",
    "react-doctor/no-cascading-set-state": "warn",
    "react-doctor/no-chain-state-updates": "warn",
    "react-doctor/no-create-context-in-render": "error",
    "react-doctor/no-create-store-in-render": "error",
    "react-doctor/no-derived-state": "warn",
    "react-doctor/no-derived-state-effect": "warn",
    "react-doctor/no-derived-useState": "warn",
    "react-doctor/no-direct-state-mutation": "warn",
    "react-doctor/no-effect-chain": "warn",
    "react-doctor/no-effect-event-handler": "warn",
    "react-doctor/no-effect-event-in-deps": "error",
    "react-doctor/no-effect-with-fresh-deps": "error",
    "react-doctor/no-event-handler": "warn",
    "react-doctor/no-event-trigger-state": "warn",
    "react-doctor/no-fetch-in-effect": "warn",
    "react-doctor/no-initialize-state": "warn",
    "react-doctor/no-mirror-prop-effect": "warn",
    "react-doctor/no-mutable-in-deps": "error",
    "react-doctor/no-mutating-reducer-state": "error",
    "react-doctor/no-pass-data-to-parent": "warn",
    "react-doctor/no-pass-live-state-to-parent": "warn",
    "react-doctor/no-prop-callback-in-effect": "warn",
    "react-doctor/no-reset-all-state-on-prop-change": "warn",
    "react-doctor/no-self-updating-effect": "warn",
    "react-doctor/no-set-state-in-render": "warn",
    "react-doctor/prefer-use-effect-event": "warn",
    "react-doctor/prefer-use-sync-external-store": "warn",
    "react-doctor/prefer-useReducer": "warn",
    "react-doctor/redux-useselector-inline-derivation": "warn",
    "react-doctor/redux-useselector-returns-new-collection": "warn",
    "react-doctor/rerender-defer-reads-hook": "warn",
    "react-doctor/rerender-dependencies": "error",
    "react-doctor/rerender-functional-setstate": "warn",
    "react-doctor/rerender-lazy-ref-init": "warn",
    "react-doctor/rerender-lazy-state-init": "warn",
    "react-doctor/rerender-state-only-in-handlers": "warn",

    // TanStack Query.
    "react-doctor/query-destructure-result": "error",
    "react-doctor/query-mutation-missing-invalidation": "warn",
    "react-doctor/query-no-query-in-effect": "warn",
    "react-doctor/query-no-rest-destructuring": "warn",
    "react-doctor/query-no-usequery-for-mutation": "warn",
    "react-doctor/query-no-void-query-fn": "warn",
    "react-doctor/query-stable-query-client": "warn",

    // View Transitions API.
    "react-doctor/no-document-start-view-transition": "warn",
    "react-doctor/no-flush-sync": "warn",

    // Zod v4 — deprecated API usage.
    "react-doctor/zod-v4-no-deprecated-error-apis": "warn",
    "react-doctor/zod-v4-no-deprecated-error-customization": "warn",
    "react-doctor/zod-v4-no-deprecated-schema-apis": "warn",
    "react-doctor/zod-v4-prefer-top-level-string-formats": "warn",
  },
});

export default config;

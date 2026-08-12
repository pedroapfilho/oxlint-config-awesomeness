# oxlint-config-awesomeness

Opinionated Oxlint config for software houses that want all their apps to feel the same.

**451 rules** across **16 plugins**. Built for full-stack TypeScript monorepos with React, Next.js, Hono, Prisma, and more.

## Installation

```
npm install -D oxlint-config-awesomeness eslint-plugin-no-only-tests eslint-plugin-perfectionist eslint-plugin-react-hooks eslint-plugin-unused-imports
```

> [!NOTE]
> Due to a limitation in Oxlint's configuration resolver, you have to directly install the JS plugins for now.

## Usage

This package ships an oxlint config object — installing it does **not** generate a config file. You opt in by importing it from your own `oxlint.config.ts`.

The fastest way is the included scaffolder:

```
npx oxlint-config-awesomeness init
```

This creates `oxlint.config.ts` in the current directory with the extends boilerplate already wired up. Pass `--force` to overwrite an existing config.

If you'd rather write the file yourself, here's all it needs to be:

```ts
import awesomeness from "oxlint-config-awesomeness";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [awesomeness],
});
```

Then run `pnpm oxlint` or `npx oxlint`.

## Upgrading from 2.x

3.0 adds **28 new restriction-level rules** that error on patterns AI-generated code routinely produces. Existing 2.x codebases may see new lint errors on upgrade — this is intentional; each rule catches a real failure mode.

**What's newly enforced:**

- **TypeScript escape hatches** — `no-explicit-any`, `no-non-null-assertion`, `no-non-null-asserted-nullish-coalescing`, `no-require-imports`, `no-var-requires`, `no-import-type-side-effects`, `use-unknown-in-catch-callback-variable`, `promise-function-async`, `no-dynamic-delete`, `no-invalid-void-type`, `no-empty-object-type`
- **React correctness** — `button-has-type` (defaults silently submit forms), `no-danger` (XSS vector), `no-unknown-property`; `react/jsx-no-useless-fragment` re-enabled via `pedantic`
- **Modern JS / Node hygiene** — `unicorn/prefer-node-protocol`, `unicorn/prefer-number-properties`, `unicorn/prefer-modern-math-apis`, `unicorn/no-document-cookie`, `unicorn/no-process-exit`, `unicorn/no-abusive-eslint-disable`, `node/handle-callback-err`, `node/no-new-require`, `node/no-path-concat`, `promise/catch-or-return`
- **Core ESLint** — `no-var`, `no-use-before-define`, `no-empty`
- **Import graph** — `import/no-cycle`
- **Accessibility** — `jsx-a11y/anchor-ambiguous-text`

**What changed in overrides:**

- New `bin/**` and `scripts/**` override turns off `no-console` and `unicorn/no-process-exit` for CLI entry points.
- Test override extended: the new strict rules that produce noise in tests (`no-require-imports`, `no-var-requires`, `promise-function-async`, `no-non-null-asserted-nullish-coalescing`, `import/no-cycle`, `no-empty`, `no-use-before-define`) are off inside tests.

**Fixing common failures:**

| Error                         | Fix                                                      |
| ----------------------------- | -------------------------------------------------------- |
| `: any` / `as any`            | Use `unknown` + narrowing, or a real type.               |
| `value!`                      | Narrow with a type guard or throw explicitly.            |
| `<button onClick={...}>`      | Add `type="button"` (or `"submit"`/`"reset"` as needed). |
| `import fs from 'fs'`         | `import fs from 'node:fs'`.                              |
| `require(...)` in TS          | Convert to ESM `import`.                                 |
| `fn(): Promise<T>`            | Add `async` to the function.                             |
| `catch((err) => err.message)` | `err` is `unknown` — narrow with `err instanceof Error`. |

Every rule has inline code documentation with bad/good examples in the [All Rules](#all-rules) section below.

## FAQ

### I installed the package but no `.oxlintrc.json` was created. What did I miss?

Nothing — that's by design. This package is an oxlint config you `import` from a JS/TS config file, not a scaffolder that runs on install (postinstall scaffolders are widely considered hostile to consumers). Run `npx oxlint-config-awesomeness init` to create `oxlint.config.ts`, or write the four-line file yourself per the Usage section above. Once that file exists, oxlint will discover it automatically.

### Can I keep using `.oxlintrc.json` and still consume this package?

No. Oxlint's JSON config format only supports file-path `extends`, not package imports — so you can't extend a JS-shipped config from JSON. Migrating to `oxlint.config.ts` is the supported path; the file is small enough to author by hand if you don't want the scaffolder.

### How do I add per-project overrides?

`defineConfig` merges the `awesomeness` config with anything else you pass. Add overrides alongside `extends`:

```ts
import awesomeness from "oxlint-config-awesomeness";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [awesomeness],
  overrides: [{ files: ["scripts/**/*.ts"], rules: { "no-console": "off" } }],
});
```

## Philosophy

- **Error, Never Warn.** Warnings are noise. Either it's an issue, or it isn't.
- **Category-Based, Future-Proof.** Five rule categories (`correctness`, `suspicious`, `pedantic`, `perf`, `style`) are enabled at `error`. Restriction rules are cherry-picked individually. New rules from categories are automatically included as oxlint evolves.
- **Opinionated for Consistency.** When multiple approaches exist, this config enforces the strictest option. All apps in your organization will feel the same.
- **Smart Overrides.** Test files, Storybook stories, seed scripts, config files, and E2E fixtures get relaxed rules where strict enforcement creates noise.
- **Formatter-Safe.** No formatting rules. Pair with [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for formatting.
- **Prevent Bugs.** Debug-only code like `console.log` or `test.only` are errors. Missing `throw`, bad comparisons, and floating promises are caught automatically.

## Plugins

| Plugin        | Rules | Description                                    |
| ------------- | ----- | ---------------------------------------------- |
| eslint (core) | 151   | JavaScript best practices and error prevention |
| unicorn       | 112   | Modern JavaScript patterns and idioms          |
| typescript    | 80    | Strict type safety and TypeScript conventions  |
| react         | 44    | React component rules, hooks, and performance  |
| jsx-a11y      | 30    | Accessibility enforcement for JSX              |
| import        | 21    | Module hygiene and import/export conventions   |
| nextjs        | 21    | Next.js framework best practices               |
| oxc           | 19    | Bug-catching rules unique to oxlint            |
| promise       | 13    | Async/promise handling                         |
| node          | 2     | Node.js environment rules                      |

Plus JS plugins: **perfectionist** (sorting), **react-hooks** + **React Compiler**, **no-only-tests**, **unused-imports**, **react-doctor** (352 diagnostics), **anti-slop** (vendored, low-evidence TypeScript patterns), and the first-party **awesomeness** plugin.

## File-Type Overrides

The config includes smart overrides so strict rules don't create noise in files that need flexibility:

| Files                                  | Relaxed Rules                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `*.test.*`, `*.spec.*`, `__tests__/**` | `no-explicit-any`, `no-non-null-assertion` (+ asserted-nullish variant), `no-require-imports`, `no-var-requires`, `promise-function-async`, all `no-unsafe-*`, `import/no-cycle`, `max-lines`, `max-lines-per-function`, `max-nested-callbacks`, `max-statements`, `no-empty`, `no-empty-function`, `no-use-before-define`, `react/no-multi-comp` |
| `*.stories.tsx`                        | `no-console`, `no-multi-comp`                                                                                                                                                                                                                                                                                                                     |
| `**/seed.ts`, `**/migrate.ts`          | `no-console`                                                                                                                                                                                                                                                                                                                                      |
| `**/bin/**`, `scripts/**`              | `no-console`, `unicorn/no-process-exit`                                                                                                                                                                                                                                                                                                           |
| `*.config.ts`, `next.config.*`, etc.   | `max-lines`, `no-anonymous-default-export`                                                                                                                                                                                                                                                                                                        |
| `**/e2e/**/fixtures/**`                | `rules-of-hooks`                                                                                                                                                                                                                                                                                                                                  |
| `*.ts`, `*.tsx` (all TypeScript)       | Rules handled natively by the TS compiler (`no-undef`, `no-redeclare`, etc.)                                                                                                                                                                                                                                                                      |

## Cherry-Picked Restriction Rules

Instead of enabling the entire `restriction` category (which includes rules like `no-bitwise`, `no-plusplus`, `capitalized-comments` that cause daily friction), this config cherry-picks the most valuable restriction rules, grouped by plugin:

**Core ESLint**
`curly`, `default-case`, `eqeqeq`, `grouped-accessor-pairs`, `max-classes-per-file`, `max-depth`, `max-lines`, `max-nested-callbacks`, `max-params`, `no-alert`, `no-caller`, `no-console`, `no-empty`, `no-eval`, `no-extend-native`, `no-implicit-coercion`, `no-new-func`, `no-new-wrappers`, `no-object-constructor`, `no-param-reassign`, `no-proto`, `no-return-assign`, `no-script-url`, `no-shadow`, `no-throw-literal`, `no-use-before-define`, `no-var`, `no-void`, `prefer-promise-reject-errors`, `prefer-template`

**TypeScript** — blocks escape hatches (`any`, `!`, `require`) that AI-generated code routinely produces:
`@typescript-eslint/no-dynamic-delete`, `no-empty-object-type`, `no-explicit-any`, `no-import-type-side-effects`, `no-invalid-void-type`, `no-non-null-asserted-nullish-coalescing`, `no-non-null-assertion`, `no-require-imports`, `no-var-requires`, `promise-function-async`, `use-unknown-in-catch-callback-variable`

**React**
`react/button-has-type`, `react/no-danger`, `react/no-multi-comp`, `react/no-unknown-property`

**Import graph**
`import/no-cycle`

**Unicorn** (modern JS + anti-escape-hatch)
`unicorn/no-abusive-eslint-disable`, `unicorn/no-document-cookie`, `unicorn/no-process-exit`, `unicorn/prefer-modern-math-apis`, `unicorn/prefer-node-protocol`, `unicorn/prefer-number-properties`

**Promise / Node**
`promise/catch-or-return`, `node/handle-callback-err`, `node/no-new-require`, `node/no-path-concat`

**Accessibility**
`jsx-a11y/anchor-ambiguous-text`

## Disabled by Intent

The five categories are enabled at `error`, but a small set of category-included rules are explicitly disabled because they fight modern React, Next.js, and ESM conventions:

| Category of fight                                                                        | Rules off                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React 17+ JSX transform / composition**                                                | `react/react-in-jsx-scope`, `react/jsx-props-no-spreading`, `react/jsx-max-depth`, `react/no-array-index-key`, `react/jsx-no-constructed-context-values`                                                                                                                                                                   |
| **Modern ESM (named exports, side-effect imports, namespace imports, `node:` protocol)** | `import/no-named-export`, `import/prefer-default-export`, `import/group-exports`, `import/exports-last`, `import/no-anonymous-default-export`, `import/no-nodejs-modules`, `import/no-unassigned-import`, `import/no-namespace`, `import/max-dependencies`, `import/first`, `import/consistent-type-specifier-style`       |
| **Pedantic style preferences**                                                           | `no-magic-numbers`, `no-ternary`, `no-inline-comments`, `capitalized-comments`, `arrow-body-style`, `func-style`, `func-names`, `init-declarations`, `no-inferrable-types`, `prefer-destructuring`, `no-negated-condition`, `no-continue`, `parameter-properties`, `max-statements`, `max-lines-per-function`, `id-length` |
| **Unicorn overreach**                                                                    | `unicorn/prefer-global-this`, `unicorn/no-useless-undefined`, `unicorn/no-nested-ternary`, `unicorn/explicit-length-check`, `unicorn/custom-error-definition`, `unicorn/no-zero-fractions`, `unicorn/escape-case`, `unicorn/no-array-callback-reference`, `unicorn/no-array-for-each`, `unicorn/no-array-reduce`           |
| **Promise rules with broken assumptions**                                                | `promise/prefer-await-to-callbacks`, `promise/avoid-new`, `promise/param-names`                                                                                                                                                                                                                                            |

A few of these are particularly worth calling out because they form **contradictory pairs** when both fire on the same code:

- `unicorn/explicit-length-check` ↔ `no-magic-numbers` — the first asks you to write `arr.length === 0`, the second then flags the `0`. No way to satisfy both.
- `import/no-named-export` ↔ `import/prefer-default-export` — exact opposites; one of them is always going to complain.
- `import/no-namespace` ↔ canonical patterns from Sentry, Prisma, lodash that recommend namespace imports — the rule doesn't know about library conventions.
- `unicorn/no-zero-fractions` ↔ float-math code that uses `1.0` for type-clarity intent — the rule has no signal about why the `.0` is there.

If you want any of these back on for your project, add them to your `oxlint.config.ts` overrides.

## Sorting Rules Disabled

`sort-imports`, `sort-keys`, and `sort-vars` are disabled because sorting is handled by **perfectionist** (for objects, enums, interfaces, JSX props) and **oxfmt** (for import ordering).

## Unicorn Overrides

| Rule                    | Setting                            | Reason                                            |
| ----------------------- | ---------------------------------- | ------------------------------------------------- |
| `unicorn/filename-case` | kebab-case with Next.js exceptions | Allows `[slug]`, `[...catchAll]`, `_app` patterns |
| `unicorn/no-null`       | off                                | APIs, JSON, and DOM all return `null`             |

## Suggestions

This configuration is meant to be used with:

- [TypeScript](https://www.typescriptlang.org/) with strict mode and [`noUnusedLocals`](https://www.typescriptlang.org/tsconfig#noUnusedLocals)
- [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for code formatting
- [Turborepo](https://turbo.build/) for monorepo orchestration

## Credits

Based on [`@nkzw/oxlint-config`](https://github.com/nkzw-tech/oxlint-config) by [Christoph Nakazawa](https://github.com/cpojer).

---

## All Rules

Every active rule is listed below with a description and code example.

## ESLint Core Rules

### accessor-pairs

Enforce getter/setter pairs in objects and classes.

```js
// bad
const obj = {
  set value(val) {
    this._value = val;
  },
};

// good
const obj = {
  get value() {
    return this._value;
  },
  set value(val) {
    this._value = val;
  },
};
```

### array-callback-return

Enforce return statements in array method callbacks.

```js
// bad
[1, 2, 3].map((x) => {
  x * 2;
});

// good
[1, 2, 3].map((x) => x * 2);
```

### arrow-body-style

Enforce braces in arrow functions only when needed.

```js
// bad
const fn = () => {
  return true;
};

// good
const fn = () => true;
```

### block-scoped-var

Enforce that `var` declarations are used within their defined scope.

```js
// bad
if (true) {
  var x = 1;
}
console.log(x);

// good
if (true) {
  let x = 1;
  console.log(x);
}
```

### capitalized-comments

Require the first letter of a comment to be capitalized.

```js
// bad
// this is a comment

// good
// This is a comment
```

### class-methods-use-this

Require class methods to use `this` or be made static.

```js
// bad
class Foo {
  greet() {
    return "hello";
  }
}

// good
class Foo {
  greet() {
    return this.name;
  }
}
```

### complexity

Enforce a maximum cyclomatic complexity for functions.

```js
// bad
function check(a, b, c, d, e) {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          if (e) {
          }
        }
      }
    }
  }
}

// good
function check(a) {
  if (!a) return;
  handle(a);
}
```

### constructor-super

Require `super()` calls in constructors of derived classes.

```js
// bad
class Child extends Parent {
  constructor() {
    this.x = 1;
  }
}

// good
class Child extends Parent {
  constructor() {
    super();
    this.x = 1;
  }
}
```

### curly

Require braces around all control-flow bodies.

```js
// bad
if (foo) bar();

// good
if (foo) {
  bar();
}
```

### default-case

Require a `default` case in `switch` statements.

```js
// bad
switch (action) {
  case "run":
    run();
    break;
}

// good
switch (action) {
  case "run":
    run();
    break;
  default:
    idle();
    break;
}
```

### default-case-last

Enforce `default` clause to be the last case in `switch`.

```js
// bad
switch (action) {
  default:
    idle();
    break;
  case "run":
    run();
    break;
}

// good
switch (action) {
  case "run":
    run();
    break;
  default:
    idle();
    break;
}
```

### default-param-last

Enforce default parameters to be last in the parameter list.

```js
// bad
function fn(a = 1, b) {}

// good
function fn(b, a = 1) {}
```

### eqeqeq

Require `===` and `!==` instead of `==` and `!=`.

```js
// bad
if (x == 1) {
}

// good
if (x === 1) {
}
```

### for-direction

Enforce that a `for` loop update clause moves in the correct direction.

```js
// bad
for (let i = 0; i < 10; i--) {}

// good
for (let i = 0; i < 10; i++) {}
```

### func-names

Require named function expressions for better stack traces.

```js
// bad
const foo = function () {};

// good
const foo = function foo() {};
```

### func-style

Enforce the use of function expressions over declarations.

```js
// bad
function foo() {}

// good
const foo = function () {};
```

### grouped-accessor-pairs

Require getter and setter pairs to be adjacent in objects.

```js
// bad
const obj = {
  get a() {},
  b: 1,
  set a(val) {},
};

// good
const obj = {
  get a() {},
  set a(val) {},
  b: 1,
};
```

### guard-for-in

Require `hasOwnProperty` checks in `for...in` loops.

```js
// bad
for (const key in obj) {
  doSomething(key);
}

// good
for (const key in obj) {
  if (Object.hasOwn(obj, key)) doSomething(key);
}
```

### id-length

Enforce minimum and maximum identifier length.

```js
// bad
const x = 1;

// good
const count = 1;
```

### init-declarations

Require variables to be initialized at declaration.

```js
// bad
let count;
count = 0;

// good
let count = 0;
```

### max-classes-per-file

Enforce a maximum of one class per file.

```js
// bad
class Foo {}
class Bar {}

// good
// foo.js
class Foo {}
```

### max-depth

Enforce a maximum nesting depth of 4.

```js
// bad
if (a) {
  if (b) {
    if (c) {
      if (d) {
        if (e) {
        }
      }
    }
  }
}

// good
if (!a || !b) return;
if (c && d) handle();
```

### max-lines

Enforce a maximum of 400 lines per file (excluding blanks and comments).

```js
// bad
// A file with 500+ lines of code

// good
// Split into focused modules under 400 lines
```

### max-lines-per-function

Enforce a maximum number of lines per function.

```js
// bad
function bigFn() {
  // ... 300 lines of logic
}

// good
function smallFn() {
  // ... focused, under the limit
}
```

### max-nested-callbacks

Enforce a maximum of 3 nested callbacks.

```js
// bad
fn(() => {
  fn(() => {
    fn(() => {
      fn(() => {});
    });
  });
});

// good
const inner = () => {};
const middle = () => fn(inner);
fn(middle);
```

### max-params

Enforce a maximum of 4 parameters per function.

```js
// bad
function fn(a, b, c, d, e) {}

// good
function fn({ a, b, c, d, e }) {}
```

### max-statements

Enforce a maximum number of statements per function.

```js
// bad
function fn() {
  // ... 50 statements
}

// good
function fn() {
  // ... focused, fewer statements
}
```

### new-cap

Require constructor names to begin with a capital letter.

```js
// bad
const thing = new myObject();

// good
const thing = new MyObject();
```

### no-alert

Disallow `alert`, `confirm`, and `prompt`.

```js
// bad
alert("done");

// good
showNotification("done");
```

### no-array-constructor

Disallow the `Array` constructor.

```js
// bad
const arr = new Array(1, 2, 3);

// good
const arr = [1, 2, 3];
```

### no-async-promise-executor

Disallow using `async` function as a Promise executor.

```js
// bad
const p = new Promise(async (resolve) => {
  resolve(await fetch(url));
});

// good
const p = fetch(url);
```

### no-await-in-loop

Disallow `await` inside loops. Use `Promise.all` instead.

```js
// bad
for (const url of urls) {
  await fetch(url);
}

// good
await Promise.all(urls.map((url) => fetch(url)));
```

### no-bitwise

Disallow bitwise operators.

```js
// bad
const flags = a | b;

// good
const flags = a || b;
```

### no-caller

Disallow `arguments.caller` and `arguments.callee`.

```js
// bad
function fn() {
  return arguments.callee;
}

// good
function fn() {
  return fn;
}
```

### no-case-declarations

Disallow lexical declarations in `case` clauses without blocks.

```js
// bad
switch (x) {
  case 0:
    let result = calc();
}

// good
switch (x) {
  case 0: {
    let result = calc();
  }
}
```

### no-class-assign

Disallow reassigning class declarations.

```js
// bad
class Foo {}
Foo = "bar";

// good
class Foo {}
const bar = "bar";
```

### no-compare-neg-zero

Disallow comparing against `-0`.

```js
// bad
if (x === -0) {
}

// good
if (Object.is(x, -0)) {
}
```

### no-cond-assign

Disallow assignment operators in conditional statements.

```js
// bad
if ((x = 0)) {
}

// good
if (x === 0) {
}
```

### no-console

Disallow `console` usage in production code.

```js
// bad
console.log("debug");

// good
logger.info("debug");
```

### no-const-assign

Disallow reassigning `const` variables.

```js
// bad
const x = 1;
x = 2;

// good
let x = 1;
x = 2;
```

### no-constant-binary-expression

Disallow expressions where the operation does not affect the value.

```js
// bad
const result = x ?? 'default' || 'fallback';

// good
const result = (x ?? 'default') || 'fallback';
```

### no-constant-condition

Disallow constant expressions in conditions.

```js
// bad
if (true) {
}

// good
if (isReady) {
}
```

### no-constructor-return

Disallow returning a value from a constructor.

```js
// bad
class Foo {
  constructor() {
    return {};
  }
}

// good
class Foo {
  constructor() {
    this.x = 1;
  }
}
```

### no-continue

Disallow `continue` statements.

```js
// bad
for (const x of items) {
  if (!x) continue;
  process(x);
}

// good
for (const x of items) {
  if (x) process(x);
}
```

### no-control-regex

Disallow control characters in regular expressions.

```js
// bad
const re = /\x1f/;

// good
const re = /\n/;
```

### no-debugger

Disallow the `debugger` statement.

```js
// bad
debugger;

// good
// Use browser devtools breakpoints instead
```

### no-delete-var

Disallow deleting variables.

```js
// bad
let x = 1;
delete x;

// good
let x = 1;
x = undefined;
```

### no-div-regex

Disallow division operators at the start of regular expressions.

```js
// bad
const re = /=foo/;

// good
const re = /[=]foo/;
```

### no-dupe-class-members

Disallow duplicate class members.

```js
// bad
class Foo {
  bar() {}
  bar() {}
}

// good
class Foo {
  bar() {}
  baz() {}
}
```

### no-dupe-else-if

Disallow duplicate conditions in `else-if` chains.

```js
// bad
if (a) {
} else if (a) {
}

// good
if (a) {
} else if (b) {
}
```

### no-dupe-keys

Disallow duplicate keys in object literals.

```js
// bad
const obj = { a: 1, a: 2 };

// good
const obj = { a: 1, b: 2 };
```

### no-duplicate-case

Disallow duplicate `case` labels in `switch`.

```js
// bad
switch (x) {
  case 1:
    break;
  case 1:
    break;
}

// good
switch (x) {
  case 1:
    break;
  case 2:
    break;
}
```

### no-duplicate-imports

Disallow duplicate module imports.

```js
// bad
import { a } from "mod";
import { b } from "mod";

// good
import { a, b } from "mod";
```

### no-else-return

Disallow `else` blocks after `return` in `if`.

```js
// bad
if (x) {
  return a;
} else {
  return b;
}

// good
if (x) {
  return a;
}
return b;
```

### no-empty

Disallow empty block statements.

```js
// bad
if (condition) {
}

// good
if (condition) {
  handleCase();
}
```

### no-empty-character-class

Disallow empty character classes in regular expressions.

```js
// bad
const re = /abc[]/;

// good
const re = /abc[a-z]/;
```

### no-empty-function

Disallow empty functions.

```js
// bad
function noop() {}

// good
function noop() {
  /* Intentionally empty */
}
```

### no-empty-pattern

Disallow empty destructuring patterns.

```js
// bad
const {} = obj;

// good
const { a } = obj;
```

### no-empty-static-block

Disallow empty static blocks in classes.

```js
// bad
class Foo {
  static {}
}

// good
class Foo {
  static {
    this.count = 0;
  }
}
```

### no-eq-null

Disallow `== null` comparisons.

```js
// bad
if (x == null) {
}

// good
if (x === null || x === undefined) {
}
```

### no-eval

Disallow `eval()`.

```js
// bad
eval('alert("hi")');

// good
alert("hi");
```

### no-ex-assign

Disallow reassigning exceptions in `catch` clauses.

```js
// bad
try {
} catch (e) {
  e = new Error();
}

// good
try {
} catch (e) {
  const wrapped = new Error();
}
```

### no-extend-native

Disallow extending native objects.

```js
// bad
Array.prototype.first = function () {};

// good
function first(arr) {
  return arr[0];
}
```

### no-extra-bind

Disallow unnecessary `.bind()` calls.

```js
// bad
const fn = function () {
  return 1;
}.bind(this);

// good
const fn = function () {
  return 1;
};
```

### no-extra-boolean-cast

Disallow unnecessary boolean casts.

```js
// bad
if (!!x) {
}

// good
if (x) {
}
```

### no-extra-label

Disallow unnecessary labels.

```js
// bad
outer: while (true) {
  break outer;
}

// good
while (true) {
  break;
}
```

### no-fallthrough

Disallow fallthrough of `case` statements.

```js
// bad
switch (x) {
  case 1:
    doA();
  case 2:
    doB();
}

// good
switch (x) {
  case 1:
    doA();
    break;
  case 2:
    doB();
    break;
}
```

### no-func-assign

Disallow reassigning `function` declarations.

```js
// bad
function foo() {}
foo = bar;

// good
function foo() {}
const baz = bar;
```

### no-global-assign

Disallow assignments to native objects or read-only global variables.

```js
// bad
undefined = 1;

// good
const myUndefined = 1;
```

### no-implicit-coercion

Disallow shorthand type conversions.

```js
// bad
const str = "" + value;
const num = +value;

// good
const str = String(value);
const num = Number(value);
```

### no-import-assign

Disallow assigning to imported bindings.

```js
// bad
import { x } from "mod";
x = 1;

// good
import { x } from "mod";
const y = 1;
```

### no-inline-comments

Disallow inline comments after code.

```js
// bad
const x = 1; // inline comment

// good
// Comment above
const x = 1;
```

### no-inner-declarations

Disallow variable or `function` declarations in nested blocks.

```js
// bad
if (test) {
  function doSomething() {}
}

// good
function doSomething() {}
if (test) {
  doSomething();
}
```

### no-invalid-regexp

Disallow invalid regular expression strings in `RegExp` constructors.

```js
// bad
new RegExp("[");

// good
new RegExp("[a-z]");
```

### no-irregular-whitespace

Disallow irregular whitespace characters.

```js
// bad
const desc = "foo\u00A0bar";

// good
const desc = "foo bar";
```

### no-iterator

Disallow the `__iterator__` property.

```js
// bad
Foo.prototype.__iterator__ = function () {};

// good
Foo.prototype[Symbol.iterator] = function () {};
```

### no-label-var

Disallow labels that share a name with a variable.

```js
// bad
let x = 1;
x: while (true) {
  break x;
}

// good
loop: while (true) {
  break loop;
}
```

### no-labels

Disallow labeled statements.

```js
// bad
outer: for (;;) {
  break outer;
}

// good
for (;;) {
  break;
}
```

### no-lone-blocks

Disallow unnecessary nested blocks.

```js
// bad
{
  const x = 1;
}

// good
const x = 1;
```

### no-lonely-if

Disallow `if` as the only statement in an `else` block.

```js
// bad
if (a) {
} else {
  if (b) {
  }
}

// good
if (a) {
} else if (b) {
}
```

### no-loop-func

Disallow functions inside loops that reference loop variables.

```js
// bad
for (var i = 0; i < 5; i++) {
  fns.push(() => i);
}

// good
for (let i = 0; i < 5; i++) {
  fns.push(() => i);
}
```

### no-loss-of-precision

Disallow number literals that lose precision.

```js
// bad
const x = 9007199254740993;

// good
const x = 9007199254740992n;
```

### no-misleading-character-class

Disallow characters composed of multiple code points in character classes.

```js
// bad
const re = /[👶🏻]/;

// good
const re = /👶🏻/u;
```

### no-multi-assign

Disallow chained assignment expressions.

```js
// bad
let a = (b = c = 1);

// good
let a = 1;
let b = 1;
let c = 1;
```

### no-multi-str

Disallow multiline strings using backslash.

```js
// bad
const str =
  "line1 \
line2";

// good
const str = "line1\nline2";
```

### no-negated-condition

Disallow negated conditions when an `else` is present.

```js
// bad
if (!x) {
  a();
} else {
  b();
}

// good
if (x) {
  b();
} else {
  a();
}
```

### no-nested-ternary

Disallow nested ternary expressions.

```js
// bad
const x = a ? (b ? c : d) : e;

// good
const inner = b ? c : d;
const x = a ? inner : e;
```

### no-new

Disallow `new` operators outside of assignments or comparisons.

```js
// bad
new SideEffect();

// good
const instance = new SideEffect();
```

### no-new-func

Disallow the `Function` constructor.

```js
// bad
const fn = new Function("a", "return a");

// good
const fn = (a) => a;
```

### no-new-native-nonconstructor

Disallow `new` operators with `Symbol` and `BigInt`.

```js
// bad
const sym = new Symbol("desc");

// good
const sym = Symbol("desc");
```

### no-new-wrappers

Disallow primitive wrapper instances (`new String`, `new Number`, `new Boolean`).

```js
// bad
const str = new String("hello");

// good
const str = "hello";
```

### no-nonoctal-decimal-escape

Disallow `\8` and `\9` escape sequences in string literals.

```js
// bad
const str = "\8";

// good
const str = "8";
```

### no-obj-calls

Disallow calling global objects as functions.

```js
// bad
const math = Math();

// good
const pi = Math.PI;
```

### no-object-constructor

Disallow the `Object` constructor without arguments.

```js
// bad
const obj = new Object();

// good
const obj = {};
```

### no-param-reassign

Disallow reassigning function parameters.

```js
// bad
function fn(x) {
  x = 10;
}

// good
function fn(x) {
  const y = 10;
}
```

### no-plusplus

Disallow the unary `++` and `--` operators.

```js
// bad
let i = 0;
i++;

// good
let i = 0;
i += 1;
```

### no-promise-executor-return

Disallow returning values from Promise executor functions.

```js
// bad
new Promise((resolve) => resolve(1));

// good
new Promise((resolve) => {
  resolve(1);
});
```

### no-proto

Disallow the `__proto__` property.

```js
// bad
const proto = obj.__proto__;

// good
const proto = Object.getPrototypeOf(obj);
```

### no-prototype-builtins

Disallow calling `Object.prototype` methods directly on objects.

```js
// bad
obj.hasOwnProperty("key");

// good
Object.hasOwn(obj, "key");
```

### no-redeclare

Disallow variable redeclaration.

```js
// bad
var x = 1;
var x = 2;

// good
let x = 1;
x = 2;
```

### no-regex-spaces

Disallow multiple spaces in regular expressions.

```js
// bad
const re = /foo   bar/;

// good
const re = /foo {3}bar/;
```

### no-restricted-globals

Disallow specified global variables.

```js
// bad
event.preventDefault();

// good
function handler(event) {
  event.preventDefault();
}
```

### no-restricted-imports

Disallow specified modules when loaded by `import`.

```js
// bad
import _ from "lodash";

// good
import groupBy from "lodash/groupBy";
```

### no-return-assign

Disallow assignment operators in `return` statements.

```js
// bad
const fn = () => (result = value);

// good
const fn = () => {
  result = value;
};
```

### no-script-url

Disallow `javascript:` URLs.

```js
// bad
location.href = "javascript:void(0)";

// good
location.href = "#";
```

### no-self-assign

Disallow assignments where both sides are exactly the same.

```js
// bad
x = x;

// good
x = y;
```

### no-self-compare

Disallow comparisons where both sides are exactly the same.

```js
// bad
if (x === x) {
}

// good
if (Number.isNaN(x)) {
}
```

### no-sequences

Disallow comma operators.

```js
// bad
const x = (doSomething(), val);

// good
doSomething();
const x = val;
```

### no-setter-return

Disallow returning values from setters.

```js
// bad
const obj = {
  set x(val) {
    return val;
  },
};

// good
const obj = {
  set x(val) {
    this._x = val;
  },
};
```

### no-shadow

Disallow variable declarations from shadowing outer scope variables.

```js
// bad
const x = 1;
function fn() {
  const x = 2;
}

// good
const x = 1;
function fn() {
  const y = 2;
}
```

### no-shadow-restricted-names

Disallow shadowing restricted identifiers like `undefined`, `NaN`, `Infinity`.

```js
// bad
const undefined = "foo";

// good
const undef = "foo";
```

### no-sparse-arrays

Disallow sparse arrays.

```js
// bad
const arr = [1, , 3];

// good
const arr = [1, undefined, 3];
```

### no-template-curly-in-string

Disallow template literal placeholder syntax in regular strings.

```js
// bad
const msg = "Hello ${name}";

// good
const msg = `Hello ${name}`;
```

### no-this-before-super

Disallow `this`/`super` before calling `super()` in constructors.

```js
// bad
class A extends B {
  constructor() {
    this.x = 1;
    super();
  }
}

// good
class A extends B {
  constructor() {
    super();
    this.x = 1;
  }
}
```

### no-throw-literal

Require throwing `Error` objects only.

```js
// bad
throw "error";

// good
throw new Error("error");
```

### no-unassigned-vars

Disallow variables that are declared but never assigned.

```js
// bad
let x;
console.log(x);

// good
const x = 0;
console.log(x);
```

### no-unexpected-multiline

Disallow confusing multiline expressions.

```js
// bad
const foo = bar(1 + 2).toString();

// good
const foo = bar;
(1 + 2).toString();
```

### no-unmodified-loop-condition

Disallow unmodified conditions in loops.

```js
// bad
let x = true;
while (x) {
  doSomething();
}

// good
let x = true;
while (x) {
  x = doSomething();
}
```

### no-unneeded-ternary

Disallow ternary operators when simpler alternatives exist.

```js
// bad
const isYes = answer === 1 ? true : false;

// good
const isYes = answer === 1;
```

### no-unsafe-finally

Disallow control flow statements in `finally` blocks.

```js
// bad
try {
} finally {
  return 1;
}

// good
try {
} finally {
  cleanup();
}
```

### no-unsafe-negation

Disallow negating the left operand of relational operators.

```js
// bad
if ((!key) in object) {
}

// good
if (!(key in object)) {
}
```

### no-unsafe-optional-chaining

Disallow optional chaining in contexts where `undefined` is not allowed.

```js
// bad
const result = (obj?.foo)();

// good
const result = obj?.foo?.();
```

### no-unused-expressions

Disallow unused expressions.

```js
// bad
x + 1;

// good
const result = x + 1;
```

### no-unused-labels

Disallow unused labels.

```js
// bad
OUTER: for (;;) {
  break;
}

// good
for (;;) {
  break;
}
```

### no-unused-private-class-members

Disallow unused private class members.

```js
// bad
class Foo {
  #unused = 1;
}

// good
class Foo {
  #count = 0;
  increment() {
    this.#count += 1;
  }
}
```

### no-unused-vars

Disallow unused variables.

```js
// bad
const unused = 1;

// good
const used = 1;
console.log(used);
```

### no-use-before-define

Disallow using variables before they are defined.

```js
// bad
console.log(x);
const x = 1;

// good
const x = 1;
console.log(x);
```

### no-useless-backreference

Disallow useless backreferences in regular expressions.

```js
// bad
const re = /(?:a)\1/;

// good
const re = /(a)\1/;
```

### no-useless-call

Disallow unnecessary `.call()` and `.apply()`.

```js
// bad
fn.call(undefined, arg);

// good
fn(arg);
```

### no-useless-catch

Disallow `catch` clauses that only rethrow.

```js
// bad
try {
  doSomething();
} catch (e) {
  throw e;
}

// good
doSomething();
```

### no-useless-computed-key

Disallow unnecessary computed property keys.

```js
// bad
const obj = { ["a"]: 1 };

// good
const obj = { a: 1 };
```

### no-useless-concat

Disallow unnecessary concatenation of strings.

```js
// bad
const str = "a" + "b";

// good
const str = "ab";
```

### no-useless-constructor

Disallow unnecessary constructors.

```js
// bad
class Foo {
  constructor() {}
}

// good
class Foo {}
```

### no-useless-escape

Disallow unnecessary escape characters.

```js
// bad
const str = '\"';

// good
const str = '"';
```

### no-useless-rename

Disallow renaming import, export, and destructured assignments to the same name.

```js
// bad
import { foo as foo } from "mod";

// good
import { foo } from "mod";
```

### no-useless-return

Disallow redundant return statements.

```js
// bad
function fn() {
  doSomething();
  return;
}

// good
function fn() {
  doSomething();
}
```

### no-var

Require `let` or `const` instead of `var`.

```js
// bad
var x = 1;

// good
const x = 1;
```

### no-void

Disallow the `void` operator.

```js
// bad
void 0;

// good
undefined;
```

### no-warning-comments

Disallow comments containing `@nocommit`.

```js
// bad
// @nocommit temporary hack

// good
// TODO: refactor this later
```

### no-with

Disallow `with` statements.

```js
// bad
with (obj) {
  foo = 1;
}

// good
obj.foo = 1;
```

### one-var

Require one declaration per variable; never comma-combine declarations.

```js
// bad
const a = 1,
  b = 2;

// good
const a = 1;
const b = 2;
```

### operator-assignment

Require shorthand operators where possible.

```js
// bad
x = x + 1;

// good
x += 1;
```

### prefer-const

Require `const` for variables that are never reassigned.

```js
// bad
let x = 1;

// good
const x = 1;
```

### prefer-destructuring

Require destructuring from arrays and objects.

```js
// bad
const x = arr[0];
const y = obj.y;

// good
const [x] = arr;
const { y } = obj;
```

### prefer-exponentiation-operator

Require `**` instead of `Math.pow()`.

```js
// bad
const sq = Math.pow(x, 2);

// good
const sq = x ** 2;
```

### prefer-numeric-literals

Require binary, octal, and hexadecimal literals instead of `parseInt()`.

```js
// bad
const x = parseInt("111110111", 2);

// good
const x = 0b111110111;
```

### prefer-object-has-own

Require `Object.hasOwn()` over `Object.prototype.hasOwnProperty.call()`.

```js
// bad
Object.prototype.hasOwnProperty.call(obj, "key");

// good
Object.hasOwn(obj, "key");
```

### prefer-object-spread

Require spread syntax instead of `Object.assign()`.

```js
// bad
const obj = Object.assign({}, defaults, overrides);

// good
const obj = { ...defaults, ...overrides };
```

### prefer-promise-reject-errors

Require `Error` objects as Promise rejection reasons.

```js
// bad
Promise.reject("error");

// good
Promise.reject(new Error("error"));
```

### prefer-rest-params

Require rest parameters instead of `arguments`.

```js
// bad
function fn() {
  return arguments;
}

// good
function fn(...args) {
  return args;
}
```

### prefer-spread

Require spread syntax instead of `.apply()`.

```js
// bad
Math.max.apply(Math, nums);

// good
Math.max(...nums);
```

### prefer-template

Require template literals instead of string concatenation.

```js
// bad
const msg = "Hello " + name;

// good
const msg = `Hello ${name}`;
```

### preserve-caught-error

Require a parameter in `catch` clauses.

```js
// bad
try {
} catch {
  handleError();
}

// good
try {
} catch (error) {
  handleError(error);
}
```

### radix

Require the radix parameter in `parseInt()`.

```js
// bad
parseInt("071");

// good
parseInt("071", 10);
```

### require-await

Disallow `async` functions that have no `await` expression.

```js
// bad
async function fn() {
  return 1;
}

// good
async function fn() {
  return await fetchData();
}
```

### require-unicode-regexp

Require the `v` flag on regular expressions for Unicode-aware matching with set notation.

```js
// bad
const re = /[a-z]/;

// good
const re = /[a-z]/v;
```

### require-yield

Require `yield` in generator functions.

```js
// bad
function* gen() {
  return 1;
}

// good
function* gen() {
  yield 1;
}
```

### symbol-description

Require a description when creating `Symbol`.

```js
// bad
const sym = Symbol();

// good
const sym = Symbol("id");
```

### unicode-bom

Disallow Unicode byte order mark (BOM).

```js
// bad
\uFEFFconst x = 1;

// good
const x = 1;
```

### use-isnan

Require `Number.isNaN()` instead of comparison with `NaN`.

```js
// bad
if (x === NaN) {
}

// good
if (Number.isNaN(x)) {
}
```

### valid-typeof

Enforce comparing `typeof` expressions against valid strings.

```js
// bad
typeof x === "strig";

// good
typeof x === "string";
```

### vars-on-top

Require `var` declarations to be at the top of their scope.

```js
// bad
function fn() {
  doSomething();
  var x = 1;
}

// good
function fn() {
  var x = 1;
  doSomething();
}
```

### yoda

Disallow Yoda conditions.

```js
// bad
if ("red" === color) {
}

// good
if (color === "red") {
}
```

## TypeScript Rules

### @typescript-eslint/adjacent-overload-signatures

Require overload signatures to be consecutive.

```ts
// bad
declare function foo(x: string): void;
declare function bar(): void;
declare function foo(x: number): void;

// good
declare function foo(x: string): void;
declare function foo(x: number): void;
declare function bar(): void;
```

### @typescript-eslint/array-type

Enforce using generic `Array<T>` syntax over `T[]`.

```ts
// bad
const items: string[] = [];

// good
const items: Array<string> = [];
```

### @typescript-eslint/ban-ts-comment

Disallow `@ts-ignore`, `@ts-nocheck`, and `@ts-check` comments.

```ts
// bad
// @ts-ignore
const x: number = "hello";

// good
const x: number = Number("hello");
```

### @typescript-eslint/ban-tslint-comment

Disallow `// tslint:<rule>` comments.

```ts
// bad
// tslint:disable-next-line

// good
// eslint-disable-next-line
```

### @typescript-eslint/ban-types

Disallow certain types like `Object`, `String`, `Number`, `Boolean`.

```ts
// bad
const fn = (x: Object) => {};

// good
const fn = (x: Record<string, unknown>) => {};
```

### @typescript-eslint/class-literal-property-style

Enforce using readonly fields over getters that return literals.

```ts
// bad
class Foo {
  get name() {
    return "foo";
  }
}

// good
class Foo {
  readonly name = "foo";
}
```

### @typescript-eslint/consistent-generic-constructors

Enforce specifying type parameters on the constructor call, not the variable type.

```ts
// bad
const map: Map<string, number> = new Map();

// good
const map = new Map<string, number>();
```

### @typescript-eslint/consistent-indexed-object-style

Enforce using `Record<K, V>` over index signatures.

```ts
// bad
type Foo = { [key: string]: number };

// good
type Foo = Record<string, number>;
```

### @typescript-eslint/consistent-type-definitions

Enforce using `type` over `interface`.

```ts
// bad
interface User {
  name: string;
}

// good
type User = {
  name: string;
};
```

### @typescript-eslint/consistent-type-imports

Enforce consistent usage of type imports.

```ts
// bad
import { User } from "./types";

// good
import type { User } from "./types";
```

### @typescript-eslint/default-param-last

Enforce default parameters to be last (TypeScript version).

```ts
// bad
function fn(a: number = 1, b: number) {}

// good
function fn(b: number, a: number = 1) {}
```

### @typescript-eslint/explicit-function-return-type

Require explicit return types on functions and class methods.

```ts
// bad
const fn = () => "hello";

// good
const fn = (): string => "hello";
```

### @typescript-eslint/explicit-member-accessibility

Require explicit accessibility modifiers on class properties and methods.

```ts
// bad
class Foo {
  x = 1;
}

// good
class Foo {
  public x = 1;
}
```

### @typescript-eslint/explicit-module-boundary-types

Require explicit return and argument types on exported functions.

```ts
// bad
export const fn = (x) => x + 1;

// good
export const fn = (x: number): number => x + 1;
```

### @typescript-eslint/member-ordering

Enforce a consistent member declaration order.

```ts
// bad
class Foo {
  method() {}
  public x = 1;
}

// good
class Foo {
  public x = 1;
  method() {}
}
```

### @typescript-eslint/method-signature-style

Enforce using property-style method signatures.

```ts
// bad
type Foo = {
  bar(x: number): void;
};

// good
type Foo = {
  bar: (x: number) => void;
};
```

### @typescript-eslint/naming-convention

Enforce naming conventions for identifiers.

```ts
// bad
const my_var = 1;
type myType = string;

// good
const myVar = 1;
type MyType = string;
```

### @typescript-eslint/no-confusing-non-null-assertion

Disallow non-null assertions in confusing positions.

```ts
// bad
const x = foo!.bar;

// good
const x = foo?.bar;
```

### @typescript-eslint/no-confusing-void-expression

Require expressions of type `void` to appear in statement position.

```ts
// bad
const x = alert("hi");

// good
alert("hi");
```

### @typescript-eslint/no-deprecated

Disallow usage of deprecated APIs.

```ts
// bad
/** @deprecated Use newFn instead */
declare function oldFn(): void;
oldFn();

// good
newFn();
```

### @typescript-eslint/no-dupe-class-members

Disallow duplicate class members (TypeScript version).

```ts
// bad
class Foo {
  bar() {}
  bar() {}
}

// good
class Foo {
  bar() {}
  baz() {}
}
```

### @typescript-eslint/no-duplicate-enum-values

Disallow duplicate enum member values.

```ts
// bad
enum E {
  A = 1,
  B = 1,
}

// good
enum E {
  A = 1,
  B = 2,
}
```

### @typescript-eslint/no-dynamic-delete

Disallow using the `delete` operator on computed key expressions.

```ts
// bad
delete obj[key];

// good
Reflect.deleteProperty(obj, key);
```

### @typescript-eslint/no-empty-function

Disallow empty functions (TypeScript version).

```ts
// bad
function noop(): void {}

// good
function noop(): void {
  /* Intentionally empty */
}
```

### @typescript-eslint/no-empty-interface

Disallow empty interfaces.

```ts
// bad
interface Empty {}

// good
type Empty = Record<string, never>;
```

### @typescript-eslint/no-empty-object-type

Disallow `{}` as a type.

```ts
// bad
type Foo = {};

// good
type Foo = Record<string, unknown>;
```

### @typescript-eslint/no-explicit-any

Disallow the `any` type.

```ts
// bad
const x: any = {};

// good
const x: unknown = {};
```

### @typescript-eslint/no-extra-non-null-assertion

Disallow extra non-null assertions.

```ts
// bad
const x = foo!!.bar;

// good
const x = foo!.bar;
```

### @typescript-eslint/no-extraneous-class

Disallow classes with only static members.

```ts
// bad
class Utils {
  static format() {}
}

// good
export const format = () => {};
```

### @typescript-eslint/no-floating-promises

Require Promise-like statements to be handled.

```ts
// bad
fetchData();

// good
await fetchData();
```

### @typescript-eslint/no-for-in-array

Disallow iterating over arrays with `for...in`.

```ts
// bad
for (const i in arr) {
}

// good
for (const item of arr) {
}
```

### @typescript-eslint/no-import-type-side-effects

Enforce that type-only imports have inline `type` qualifiers.

```ts
// bad
import type { A, B } from "mod";

// good
import { type A, type B } from "mod";
```

### @typescript-eslint/no-inferrable-types

Disallow explicit types where they can be trivially inferred.

```ts
// bad
const x: number = 1;

// good
const x = 1;
```

### @typescript-eslint/no-invalid-void-type

Disallow `void` outside of return types and generic type arguments.

```ts
// bad
const log = (message: void) => {};

// good
const log = (message: string): void => {};
```

### @typescript-eslint/no-loop-func

Disallow functions created inside loops (TypeScript version).

```ts
// bad
for (let i = 0; i < 5; i++) {
  fns.push(() => i);
}

// good
const makeFn = (i: number) => () => i;
for (let i = 0; i < 5; i++) {
  fns.push(makeFn(i));
}
```

### @typescript-eslint/no-loss-of-precision

Disallow number literals that lose precision (TypeScript version).

```ts
// bad
const x = 9007199254740993;

// good
const x = 9007199254740992n;
```

### @typescript-eslint/no-magic-numbers

Disallow magic numbers. _Disabled in this config._

### @typescript-eslint/no-meaningless-void-operator

Disallow the `void` operator except where it is useful.

```ts
// bad
void someValue;

// good
void someAsyncOperation();
```

### @typescript-eslint/no-misused-new

Enforce valid definitions of `new` and `constructor`.

```ts
// bad
interface Foo {
  new (): Foo;
}

// good
class Foo {
  constructor() {}
}
```

### @typescript-eslint/no-misused-promises

Disallow Promises in places not designed to handle them.

```ts
// bad
if (fetchData()) {
}

// good
if (await fetchData()) {
}
```

### @typescript-eslint/no-mixed-enums

Disallow enums from mixing string and number members.

```ts
// bad
enum E {
  A = 0,
  B = "b",
}

// good
enum E {
  A = "a",
  B = "b",
}
```

### @typescript-eslint/no-namespace

Disallow TypeScript namespaces.

```ts
// bad
namespace Foo {
  export const x = 1;
}

// good
export const x = 1;
```

### @typescript-eslint/no-non-null-asserted-nullish-coalescing

Disallow non-null assertions with nullish coalescing.

```ts
// bad
const x = foo! ?? bar;

// good
const x = foo ?? bar;
```

### @typescript-eslint/no-non-null-asserted-optional-chain

Disallow non-null assertions after optional chaining.

```ts
// bad
const x = foo?.bar!;

// good
const x = foo?.bar;
```

### @typescript-eslint/no-non-null-assertion

Disallow non-null assertions using `!`.

```ts
// bad
const x = value!;

// good
const x = value ?? fallback;
```

### @typescript-eslint/no-redeclare

Disallow variable redeclaration (TypeScript version).

```ts
// bad
let x = 1;
let x = 2;

// good
let x = 1;
x = 2;
```

### @typescript-eslint/no-require-imports

Disallow `require()` calls.

```ts
// bad
const fs = require("fs");

// good
import fs from "fs";
```

### @typescript-eslint/no-restricted-imports

Disallow specified modules when loaded by `import` (TypeScript version).

```ts
// bad
import _ from "lodash";

// good
import groupBy from "lodash/groupBy";
```

### @typescript-eslint/no-shadow

Disallow variable shadowing (TypeScript version).

```ts
// bad
const x = 1;
const fn = () => {
  const x = 2;
};

// good
const x = 1;
const fn = () => {
  const y = 2;
};
```

### @typescript-eslint/no-this-alias

Disallow aliasing `this`.

```ts
// bad
const self = this;

// good
const fn = () => this.value;
```

### @typescript-eslint/no-type-alias

Disallow type aliases in favor of interfaces. _Superseded by consistent-type-definitions._

```ts
// bad
type Name = string;

// good
type User = { name: string };
```

### @typescript-eslint/no-unnecessary-boolean-literal-compare

Disallow unnecessary equality comparison against boolean literals.

```ts
// bad
if (isReady === true) {
}

// good
if (isReady) {
}
```

### @typescript-eslint/no-unnecessary-condition

Disallow conditionals where the type is always truthy or always falsy.

```ts
// bad
const x = "hello";
if (x) {
}

// good
const x = getValue();
if (x) {
}
```

### @typescript-eslint/no-unnecessary-qualifier

Disallow unnecessary namespace qualifiers.

```ts
// bad
namespace Foo {
  export type Bar = string;
  const x: Foo.Bar = "hi";
}

// good
namespace Foo {
  export type Bar = string;
  const x: Bar = "hi";
}
```

### @typescript-eslint/no-unnecessary-type-arguments

Disallow type arguments that are equal to the default.

```ts
// bad
const p = new Promise<unknown>((resolve) => resolve());

// good
const p = new Promise((resolve) => resolve());
```

### @typescript-eslint/no-unnecessary-type-assertion

Disallow type assertions that do not change the type.

```ts
// bad
const x = "hello" as string;

// good
const x = "hello";
```

### @typescript-eslint/no-unnecessary-type-constraint

Disallow unnecessary constraints on generic types.

```ts
// bad
type Foo<T extends unknown> = T;

// good
type Foo<T> = T;
```

### @typescript-eslint/no-unnecessary-type-parameters

Disallow type parameters that are only used once.

```ts
// bad
function fn<T>(x: T): void {}

// good
function fn(x: unknown): void {}
```

### @typescript-eslint/no-unsafe-argument

Disallow calling a function with a value of type `any`.

```ts
// bad
const x: any = {};
fn(x);

// good
const x: unknown = {};
fn(x as ExpectedType);
```

### @typescript-eslint/no-unsafe-assignment

Disallow assigning a value with type `any`.

```ts
// bad
const x: string = someAny;

// good
const x: string = someAny as string;
```

### @typescript-eslint/no-unsafe-call

Disallow calling a value with type `any`.

```ts
// bad
const x: any = () => {};
x();

// good
const x: () => void = () => {};
x();
```

### @typescript-eslint/no-unsafe-declaration-merging

Disallow unsafe declaration merging.

```ts
// bad
interface Foo {}
class Foo {}

// good
class Foo {}
```

### @typescript-eslint/no-unsafe-enum-comparison

Disallow comparing an enum value with a non-enum value.

```ts
// bad
enum Status {
  Active,
}
if (status === 0) {
}

// good
enum Status {
  Active,
}
if (status === Status.Active) {
}
```

### @typescript-eslint/no-unsafe-member-access

Disallow member access on a value with type `any`.

```ts
// bad
const x: any = {};
x.foo;

// good
const x: Record<string, unknown> = {};
x.foo;
```

### @typescript-eslint/no-unsafe-return

Disallow returning a value with type `any`.

```ts
// bad
function fn(): string {
  return anyValue;
}

// good
function fn(): string {
  return String(anyValue);
}
```

### @typescript-eslint/no-unsafe-unary-minus

Disallow unary minus on non-numeric types.

```ts
// bad
const x: any = "5";
const y = -x;

// good
const x = 5;
const y = -x;
```

### @typescript-eslint/no-unused-expressions

Disallow unused expressions (TypeScript version).

```ts
// bad
x + 1;

// good
const result = x + 1;
```

### @typescript-eslint/no-unused-vars

Disallow unused variables (TypeScript version).

```ts
// bad
const unused = 1;

// good
const used = 1;
console.log(used);
```

### @typescript-eslint/no-use-before-define

Disallow using variables before they are defined (TypeScript version).

```ts
// bad
console.log(x);
const x = 1;

// good
const x = 1;
console.log(x);
```

### @typescript-eslint/no-useless-constructor

Disallow unnecessary constructors (TypeScript version).

```ts
// bad
class Foo {
  constructor() {
    super();
  }
}

// good
class Foo extends Bar {}
```

### @typescript-eslint/no-useless-empty-export

Disallow empty exports that do not change anything in a module file.

```ts
// bad
export const x = 1;
export {};

// good
export const x = 1;
```

### @typescript-eslint/no-useless-template-literals

Disallow unnecessary template literals.

```ts
// bad
const x = `hello`;

// good
const x = "hello";
```

### @typescript-eslint/no-var-requires

Disallow `require` statements except in import statements.

```ts
// bad
const fs = require("fs");

// good
import fs from "fs";
```

### @typescript-eslint/no-wrapper-object-types

Disallow `String`, `Number`, `Boolean` as types.

```ts
// bad
const fn = (x: String) => {};

// good
const fn = (x: string) => {};
```

### @typescript-eslint/non-nullable-type-assertion-style

Enforce non-null assertions over explicit type casts when possible.

```ts
// bad
const x = value as string;

// good
const x = value!;
```

### @typescript-eslint/only-throw-error

Require throwing `Error` objects only (TypeScript version).

```ts
// bad
throw "error";

// good
throw new Error("error");
```

### @typescript-eslint/parameter-properties

Require or disallow parameter properties in class constructors.

```ts
// bad
class Foo {
  x: number;
  constructor(x: number) {
    this.x = x;
  }
}

// good
class Foo {
  constructor(public x: number) {}
}
```

### @typescript-eslint/prefer-as-const

Enforce the use of `as const` over literal types.

```ts
// bad
const x: "hello" = "hello";

// good
const x = "hello" as const;
```

### @typescript-eslint/prefer-enum-initializers

Require initializers for each enum member.

```ts
// bad
enum Status {
  Active,
  Inactive,
}

// good
enum Status {
  Active = 0,
  Inactive = 1,
}
```

### @typescript-eslint/prefer-find

Enforce using `Array.find` over `Array.filter` + index access.

```ts
// bad
const item = items.filter((i) => i.id === 1)[0];

// good
const item = items.find((i) => i.id === 1);
```

### @typescript-eslint/prefer-for-of

Enforce using `for...of` loops over standard `for` loops when the index is unused.

```ts
// bad
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i]);
}

// good
for (const item of arr) {
  console.log(item);
}
```

### @typescript-eslint/prefer-function-type

Enforce using function types instead of interfaces with call signatures.

```ts
// bad
interface Fn {
  (): void;
}

// good
type Fn = () => void;
```

### @typescript-eslint/prefer-includes

Enforce using `includes()` over `indexOf() !== -1`.

```ts
// bad
if (arr.indexOf(item) !== -1) {
}

// good
if (arr.includes(item)) {
}
```

### @typescript-eslint/prefer-literal-enum-member

Enforce that enum members are literal values.

```ts
// bad
enum E {
  A = computed(),
}

// good
enum E {
  A = "a",
}
```

### @typescript-eslint/prefer-namespace-keyword

Enforce using `namespace` keyword over `module` keyword.

```ts
// bad
module Foo {}

// good
namespace Foo {}
```

### @typescript-eslint/prefer-nullish-coalescing

Enforce using `??` instead of `||` for nullable values.

```ts
// bad
const x = value || "default";

// good
const x = value ?? "default";
```

### @typescript-eslint/prefer-optional-chain

Enforce using optional chaining over nested conditions.

```ts
// bad
const x = foo && foo.bar && foo.bar.baz;

// good
const x = foo?.bar?.baz;
```

### @typescript-eslint/prefer-readonly

Enforce that class members not modified after construction are marked `readonly`.

```ts
// bad
class Foo {
  private x = 1;
}

// good
class Foo {
  private readonly x = 1;
}
```

### @typescript-eslint/prefer-reduce-type-parameter

Enforce using type parameter over casting in `Array.reduce`.

```ts
// bad
const sum = arr.reduce((a, b) => a + b, 0 as number);

// good
const sum = arr.reduce<number>((a, b) => a + b, 0);
```

### @typescript-eslint/prefer-regexp-exec

Enforce using `RegExp.exec()` over `String.match()` when no global flag.

```ts
// bad
"hello".match(/ell/);

// good
/ell/.exec("hello");
```

### @typescript-eslint/prefer-return-this-type

Enforce that `this` is used as the return type when a class method returns `this`.

```ts
// bad
class Builder {
  set(): Builder {
    return this;
  }
}

// good
class Builder {
  set(): this {
    return this;
  }
}
```

### @typescript-eslint/prefer-string-starts-ends-with

Enforce using `startsWith()` and `endsWith()` over equivalent string methods.

```ts
// bad
if (str.indexOf("abc") === 0) {
}

// good
if (str.startsWith("abc")) {
}
```

### @typescript-eslint/prefer-ts-expect-error

Enforce using `@ts-expect-error` over `@ts-ignore`.

```ts
// bad
// @ts-ignore
const x: number = "hello";

// good
// @ts-expect-error -- testing invalid input
const x: number = "hello";
```

### @typescript-eslint/promise-function-async

Require functions that return Promises to be marked `async`.

```ts
// bad
function fn(): Promise<void> {
  return doWork();
}

// good
async function fn(): Promise<void> {
  return doWork();
}
```

### @typescript-eslint/require-array-sort-compare

Require a compare function for `Array.sort()`.

```ts
// bad
items.sort();

// good
items.sort((a, b) => a - b);
```

### @typescript-eslint/restrict-plus-operands

Require both operands of `+` to be the same type.

```ts
// bad
const x = "count: " + 5;

// good
const x = `count: ${5}`;
```

### @typescript-eslint/restrict-template-expressions

Enforce template literal expressions to be of string type.

```ts
// bad
const msg = `value: ${obj}`;

// good
const msg = `value: ${String(obj)}`;
```

### @typescript-eslint/return-await

Enforce returning awaited values in specific contexts.

```ts
// bad
async function fn() {
  return promise;
}

// good
async function fn() {
  return await promise;
}
```

### @typescript-eslint/switch-exhaustiveness-check

Require switch statements over unions to be exhaustive.

```ts
// bad
type T = "a" | "b";
switch (x as T) {
  case "a":
    break;
}

// good
type T = "a" | "b";
switch (x as T) {
  case "a":
    break;
  case "b":
    break;
}
```

### @typescript-eslint/triple-slash-reference

Disallow triple-slash reference directives.

```ts
// bad
/// <reference path="foo" />

// good
import foo from "foo";
```

### @typescript-eslint/typedef

Require type annotations in specific places.

```ts
// bad
const fn = (x) => x;

// good
const fn = (x: number): number => x;
```

### @typescript-eslint/unbound-method

Enforce that unbound methods are called with their expected scope.

```ts
// bad
const fn = obj.method;
fn();

// good
const fn = obj.method.bind(obj);
fn();
```

### @typescript-eslint/unified-signatures

Enforce unified signatures for overloads that could be unified.

```ts
// bad
function fn(x: string): void;
function fn(x: number): void;

// good
function fn(x: string | number): void;
```

### @typescript-eslint/use-unknown-in-catch-callback-variable

Require `unknown` for the error parameter of Promise `.catch()` and `.then()` rejection callbacks.

```ts
// bad
promise.catch((err: Error) => log(err.message));

// good
promise.catch((err: unknown) => {
  if (err instanceof Error) log(err.message);
});
```

## React Rules

### react/button-has-type

Require explicit `type` attribute on `<button>` elements.

```tsx
// bad
<button>Click</button>

// good
<button type="button">Click</button>
```

### react/checked-requires-onchange-or-readonly

Require `onChange` or `readOnly` when `checked` is used.

```tsx
// bad
<input type="checkbox" checked={true} />

// good
<input type="checkbox" checked={true} onChange={handleChange} />
```

### react/default-props-match-prop-types

Require all defaultProps to have a corresponding non-required prop type.

```tsx
// bad
type Props = { name: string };
const Comp = ({ name }: Props) => <div>{name}</div>;
Comp.defaultProps = { age: 25 };

// good
type Props = { name: string; age?: number };
const Comp = ({ name, age }: Props) => <div>{name}</div>;
Comp.defaultProps = { age: 25 };
```

### react/exhaustive-deps

Verify the list of dependencies for Hooks like `useEffect` and `useCallback`.

```tsx
// bad
useEffect(() => {
  fetchData(id);
}, []);

// good
useEffect(() => {
  fetchData(id);
}, [id]);
```

### react/forward-ref-uses-ref

Require `forwardRef` components to use the `ref` parameter.

```tsx
// bad
const Comp = forwardRef((props, ref) => <div />);

// good
const Comp = forwardRef((props, ref) => <div ref={ref} />);
```

### react/function-component-definition

Enforce arrow-function components for both named and unnamed components.

```tsx
// bad
function Card() {
  return <div />;
}

// good
const Card = () => <div />;
```

### react/iframe-missing-sandbox

Require `sandbox` attribute on `<iframe>` elements.

```tsx
// bad
<iframe src="https://example.com" />

// good
<iframe src="https://example.com" sandbox="allow-scripts" />
```

### react/jsx-boolean-value

Enforce boolean attributes notation in JSX.

```tsx
// bad
<Component disabled={true} />

// good
<Component disabled />
```

### react/jsx-curly-brace-presence

Enforce curly braces or disallow unnecessary curly braces in JSX.

```tsx
// bad
<Component name={'hello'} />

// good
<Component name="hello" />
```

### react/jsx-filename-extension

Restrict file extensions that may contain JSX.

```tsx
// bad
// Button.js with JSX content

// good
// Button.tsx with JSX content
```

### react/jsx-fragments

Enforce shorthand Fragment syntax.

```tsx
// bad
<React.Fragment><Child /></React.Fragment>

// good
<><Child /></>
```

### react/jsx-key

Require `key` props on elements in iterators.

```tsx
// bad
items.map((item) => <li>{item}</li>);

// good
items.map((item) => <li key={item.id}>{item.name}</li>);
```

### react/jsx-max-depth

Enforce maximum JSX depth.

```tsx
// bad
<A><B><C><D><E><F /></E></D></C></B></A>

// good
<A><Content /></A>
```

### react/jsx-no-bind

Disallow `.bind()` or arrow functions in JSX props.

```tsx
// bad
<Button onClick={() => handleClick(id)} />;

// good
const handleButtonClick = useCallback(() => handleClick(id), [id]);
<Button onClick={handleButtonClick} />;
```

### react/jsx-no-comment-textnodes

Disallow comments as text nodes in JSX.

```tsx
// bad
<div>// comment</div>

// good
<div>{/* comment */}</div>
```

### react/jsx-no-constructed-context-values

Prevent non-stable values from being used as context value.

```tsx
// bad
<Ctx.Provider value={{ user, setUser }}>

// good
const value = useMemo(() => ({ user, setUser }), [user]);
<Ctx.Provider value={value}>
```

### react/jsx-no-duplicate-props

Disallow duplicate props in JSX.

```tsx
// bad
<Component name="a" name="b" />

// good
<Component name="a" title="b" />
```

### react/jsx-no-leaked-render

Prevent problematic leaked values from being rendered.

```tsx
// bad
{
  count && <Items count={count} />;
}

// good
{
  count > 0 && <Items count={count} />;
}
```

### react/jsx-no-script-url

Disallow `javascript:` URLs in JSX.

```tsx
// bad
<a href="javascript:void(0)">Click</a>

// good
<a href="#" onClick={handleClick}>Click</a>
```

### react/jsx-no-target-blank

Require `rel="noreferrer"` with `target="_blank"`.

```tsx
// bad
<a href={url} target="_blank">Link</a>

// good
<a href={url} target="_blank" rel="noreferrer">Link</a>
```

### react/jsx-no-undef

Disallow undeclared variables in JSX.

```tsx
// bad
const App = () => <MissingComponent />;

// good
import { MyComponent } from "./my-component";
const App = () => <MyComponent />;
```

### react/jsx-no-useless-fragment

Disallow unnecessary fragments.

```tsx
// bad
<>{child}</>;

// good
{
  child;
}
```

### react/jsx-props-no-spread-key

Disallow `key` being spread into JSX.

```tsx
// bad
const props = { key: 'id', name: 'foo' };
<Component {...props} />

// good
<Component key="id" name="foo" />
```

### react/jsx-sort-props

Enforce alphabetical prop sorting. _Handled by perfectionist._

### react/jsx-uses-vars

Mark variables used in JSX as used.

```tsx
// good
import { Component } from "./component";
const App = () => <Component />;
```

### react/no-access-state-in-setstate

Disallow accessing `this.state` inside `setState`.

```tsx
// bad
this.setState({ count: this.state.count + 1 });

// good
this.setState((prev) => ({ count: prev.count + 1 }));
```

### react/no-array-index-key

Disallow using array index as `key`.

```tsx
// bad
items.map((item, i) => <li key={i}>{item}</li>);

// good
items.map((item) => <li key={item.id}>{item.name}</li>);
```

### react/no-children-prop

Disallow passing children as props.

```tsx
// bad
<Component children={<Child />} />

// good
<Component><Child /></Component>
```

### react/no-danger

Disallow `dangerouslySetInnerHTML`.

```tsx
// bad
<div dangerouslySetInnerHTML={{ __html: html }} />

// good
<div>{sanitizedContent}</div>
```

### react/no-danger-with-children

Disallow `dangerouslySetInnerHTML` alongside `children`.

```tsx
// bad
<div dangerouslySetInnerHTML={{ __html: 'hi' }}>Child</div>

// good
<div dangerouslySetInnerHTML={{ __html: 'hi' }} />
```

### react/no-deprecated

Disallow deprecated React methods.

```tsx
// bad
ReactDOM.render(<App />, el);

// good
createRoot(el).render(<App />);
```

### react/no-did-mount-set-state

Disallow `setState` in `componentDidMount`.

```tsx
// bad
componentDidMount() { this.setState({ loaded: true }); }

// good
// Use useEffect with state initialization instead
```

### react/no-did-update-set-state

Disallow `setState` in `componentDidUpdate`.

```tsx
// bad
componentDidUpdate() { this.setState({ updated: true }); }

// good
// Derive state from props or use getDerivedStateFromProps
```

### react/no-direct-mutation-state

Disallow direct mutation of `this.state`.

```tsx
// bad
this.state.count = 1;

// good
this.setState({ count: 1 });
```

### react/no-find-dom-node

Disallow `ReactDOM.findDOMNode`.

```tsx
// bad
ReactDOM.findDOMNode(this);

// good
const ref = useRef<HTMLDivElement>(null);
```

### react/no-is-mounted

Disallow `isMounted`.

```tsx
// bad
if (this.isMounted()) {
  this.setState({});
}

// good
// Use an AbortController or cleanup in useEffect
```

### react/no-multi-comp

Enforce a single component per file.

```tsx
// bad
const A = () => <div />;
const B = () => <div />;

// good
// a.tsx: const A = () => <div />;
```

### react/no-namespace

Disallow React namespace syntax (e.g., `<Foo:Bar />`).

```tsx
// bad
<Foo:Bar />

// good
<FooBar />
```

### react/no-redundant-should-component-update

Disallow `shouldComponentUpdate` when extending `PureComponent`.

```tsx
// bad
class Foo extends PureComponent {
  shouldComponentUpdate() {
    return true;
  }
}

// good
class Foo extends PureComponent {}
```

### react/no-render-return-value

Disallow using the return value of `ReactDOM.render`.

```tsx
// bad
const app = ReactDOM.render(<App />, el);

// good
ReactDOM.render(<App />, el);
```

### react/no-string-refs

Disallow string refs.

```tsx
// bad
<div ref="myDiv" />

// good
<div ref={myRef} />
```

### react/no-this-in-sfc

Disallow `this` in stateless function components.

```tsx
// bad
const Comp = () => <div>{this.props.name}</div>;

// good
const Comp = ({ name }: Props) => <div>{name}</div>;
```

### react/no-unescaped-entities

Disallow unescaped HTML entities in JSX.

```tsx
// bad
<div>Don't use "quotes"</div>

// good
<div>Don&apos;t use &quot;quotes&quot;</div>
```

### react/no-unknown-property

Disallow unknown DOM properties.

```tsx
// bad
<div class="foo" />

// good
<div className="foo" />
```

### react/no-unsafe

Disallow usage of unsafe lifecycle methods.

```tsx
// bad
UNSAFE_componentWillMount() {}

// good
componentDidMount() {}
```

### react/no-unstable-nested-components

Disallow creating unstable components inside components.

```tsx
// bad
const Parent = () => {
  const Child = () => <div />;
  return <Child />;
};

// good
const Child = () => <div />;
const Parent = () => <Child />;
```

### react/no-unused-class-component-methods

Disallow unused methods in class components.

```tsx
// bad
class Foo extends Component {
  unusedMethod() {}
  render() {
    return <div />;
  }
}

// good
class Foo extends Component {
  render() {
    return <div />;
  }
}
```

### react/no-unused-prop-types

Disallow unused prop types.

```tsx
// bad
type Props = { name: string; age: number };
const Comp = ({ name }: Props) => <div>{name}</div>;

// good
type Props = { name: string };
const Comp = ({ name }: Props) => <div>{name}</div>;
```

### react/no-unused-state

Disallow unused state fields.

```tsx
// bad
state = { count: 0, unused: '' };
render() { return <div>{this.state.count}</div>; }

// good
state = { count: 0 };
render() { return <div>{this.state.count}</div>; }
```

### react/no-will-update-set-state

Disallow `setState` in `componentWillUpdate`.

```tsx
// bad
componentWillUpdate() { this.setState({}); }

// good
// Use getDerivedStateFromProps or componentDidUpdate
```

### react/prefer-es6-class

Enforce ES6 class syntax for React components.

```tsx
// bad
const Comp = createReactClass({ render() {} });

// good
class Comp extends Component {
  render() {}
}
```

### react/prefer-stateless-function

Encourage stateless functional components.

```tsx
// bad
class Foo extends Component {
  render() {
    return <div>{this.props.name}</div>;
  }
}

// good
const Foo = ({ name }: Props) => <div>{name}</div>;
```

### react/require-render-return

Require `render` method to return a value.

```tsx
// bad
class Foo extends Component {
  render() {
    <div />;
  }
}

// good
class Foo extends Component {
  render() {
    return <div />;
  }
}
```

### react/rules-of-hooks

Enforce Rules of Hooks.

```tsx
// bad
if (condition) {
  useState(0);
}

// good
const [count, setCount] = useState(0);
```

### react/self-closing-comp

Require self-closing tags when children are not needed.

```tsx
// bad
<Component></Component>

// good
<Component />
```

### react/style-prop-object

Enforce that the `style` prop value is an object.

```tsx
// bad
<div style="color: red" />

// good
<div style={{ color: 'red' }} />
```

### react/void-dom-elements-no-children

Disallow children on void DOM elements.

```tsx
// bad
<br>children</br>

// good
<br />
```

## React Compiler Rules

### react-hooks-js/component-hook-factories

Enforce that component hook factory functions follow compiler rules.

```tsx
// bad
const useCustom = createHook(() => {
  let x = 0;
  x = 1;
  return x;
});

// good
const useCustom = createHook(() => {
  const [x, setX] = useState(0);
  return x;
});
```

### react-hooks-js/config

Validate React Compiler configuration.

```tsx
// bad
// Invalid compiler options

// good
// Valid compiler configuration in babel/next config
```

### react-hooks-js/error-boundaries

Enforce correct error boundary patterns for the compiler.

```tsx
// bad
class ErrorBoundary extends Component {
  state = {};
}

// good
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
}
```

### react-hooks-js/gating

Enforce gating patterns are compatible with the compiler.

```tsx
// bad
if (__DEV__) {
  useDebugHook();
}

// good
useDebugHook(__DEV__);
```

### react-hooks-js/globals

Enforce that global references are compatible with the compiler.

```tsx
// bad
function Comp() {
  return <div>{window.x}</div>;
}

// good
function Comp() {
  const x = useSyncExternalStore(subscribe, getSnapshot);
  return <div>{x}</div>;
}
```

### react-hooks-js/immutability

Enforce immutable data patterns required by the compiler.

```tsx
// bad
function Comp({ items }) {
  items.sort();
  return <List items={items} />;
}

// good
function Comp({ items }) {
  const sorted = [...items].sort();
  return <List items={sorted} />;
}
```

### react-hooks-js/incompatible-library

Flag usage of libraries incompatible with the React Compiler.

```tsx
// bad
import { observer } from "mobx-react";

// good
// Use compiler-compatible state management
```

### react-hooks-js/preserve-manual-memoization

Preserve existing `useMemo`/`useCallback` usage for the compiler.

```tsx
// bad
const value = useMemo(() => compute(a), []);

// good
const value = useMemo(() => compute(a), [a]);
```

### react-hooks-js/purity

Enforce that components and hooks are pure functions.

```tsx
// bad
let count = 0;
function Comp() {
  count += 1;
  return <div>{count}</div>;
}

// good
function Comp() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

### react-hooks-js/refs

Enforce correct ref patterns for the compiler.

```tsx
// bad
function Comp() {
  const ref = useRef(null);
  return <div>{ref.current}</div>;
}

// good
function Comp() {
  const ref = useRef<HTMLDivElement>(null);
  return <div ref={ref} />;
}
```

### react-hooks-js/set-state-in-effect

Enforce correct `setState` usage inside effects.

```tsx
// bad
useEffect(() => {
  setCount(count + 1);
}, [count]);

// good
useEffect(() => {
  setCount((prev) => prev + 1);
}, []);
```

### react-hooks-js/set-state-in-render

Disallow `setState` during render.

```tsx
// bad
function Comp() {
  const [x, setX] = useState(0);
  setX(1);
  return <div />;
}

// good
function Comp() {
  const [x, setX] = useState(0);
  useEffect(() => {
    setX(1);
  }, []);
  return <div />;
}
```

### react-hooks-js/static-components

Enforce that static components are defined outside of render.

```tsx
// bad
function Parent() {
  const Header = () => <h1>Title</h1>;
  return <Header />;
}

// good
const Header = () => <h1>Title</h1>;
function Parent() {
  return <Header />;
}
```

### react-hooks-js/unsupported-syntax

Flag syntax patterns not yet supported by the React Compiler.

```tsx
// bad
function Comp() {
  with (obj) {
    return <div />;
  }
}

// good
function Comp() {
  return <div>{obj.value}</div>;
}
```

### react-hooks-js/use-memo

Enforce correct `useMemo` usage for the compiler.

```tsx
// bad
const value = useMemo(() => expensive(a, b), [a]);

// good
const value = useMemo(() => expensive(a, b), [a, b]);
```

## Unicorn Rules

### unicorn/better-regex

Improve regexes by making them shorter and more readable.

```js
// bad
const re = /[0-9]/;

// good
const re = /\d/;
```

### unicorn/catch-error-name

Enforce a specific parameter name in catch clauses.

```js
// bad
try {
} catch (e) {}

// good
try {
} catch (error) {}
```

### unicorn/consistent-destructuring

Enforce consistent style of destructured properties.

```js
// bad
const { a } = obj;
const b = obj.b;

// good
const { a, b } = obj;
```

### unicorn/consistent-empty-array-spread

Disallow spreading empty arrays.

```js
// bad
const arr = [...[], 1, 2];

// good
const arr = [1, 2];
```

### unicorn/consistent-existence-index-check

Enforce consistent style for checking element existence with `indexOf`.

```js
// bad
if (arr.indexOf(item) >= 0) {
}

// good
if (arr.includes(item)) {
}
```

### unicorn/consistent-function-scoping

Move functions to the highest possible scope.

```js
// bad
function outer() {
  function inner(x) {
    return x * 2;
  }
  return inner(5);
}

// good
function inner(x) {
  return x * 2;
}
function outer() {
  return inner(5);
}
```

### unicorn/empty-brace-spaces

Enforce no spaces in empty braces.

```js
// bad
const obj = {};

// good
const obj = {};
```

### unicorn/error-message

Require `Error` messages.

```js
// bad
throw new Error();

// good
throw new Error("Something went wrong");
```

### unicorn/escape-case

Require uppercase escape sequences.

```js
// bad
const str = "\xa9";

// good
const str = "\xA9";
```

### unicorn/explicit-length-check

Enforce explicitly comparing the `length` property.

```js
// bad
if (arr.length) {
}

// good
if (arr.length > 0) {
}
```

### unicorn/filename-case

Enforce kebab-case filenames.

```js
// bad
// MyComponent.js

// good
// my-component.js
```

### unicorn/import-style

Enforce specific import styles per module.

```js
// bad
import * as path from "path";

// good
import path from "path";
```

### unicorn/new-for-builtins

Require `new` for builtins that need it, forbid for those that do not.

```js
// bad
const err = Error("fail");
const sym = new Symbol("x");

// good
const err = new Error("fail");
const sym = Symbol("x");
```

### unicorn/no-abusive-eslint-disable

Disallow `eslint-disable` without specifying rules.

```js
// bad
/* eslint-disable */

// good
/* eslint-disable no-console */
```

### unicorn/no-anonymous-default-export

Disallow anonymous default exports.

```js
// bad
export default () => {};

// good
const fn = () => {};
export default fn;
```

### unicorn/no-array-callback-reference

Disallow passing a function reference directly to array methods.

```js
// bad
const nums = ["1", "2"].map(Number);

// good
const nums = ["1", "2"].map((x) => Number(x));
```

### unicorn/no-array-for-each

Prefer `for...of` over `Array.forEach`.

```js
// bad
items.forEach((item) => process(item));

// good
for (const item of items) {
  process(item);
}
```

### unicorn/no-array-method-this-argument

Disallow using the `thisArg` argument in array methods.

```js
// bad
arr.map(fn, thisArg);

// good
arr.map((x) => fn.call(thisArg, x));
```

### unicorn/no-array-push-push

Enforce combining multiple `push()` into one call.

```js
// bad
arr.push(1);
arr.push(2);

// good
arr.push(1, 2);
```

### unicorn/no-array-reduce

Disallow `Array.reduce()` and `Array.reduceRight()`.

```js
// bad
const sum = arr.reduce((a, b) => a + b, 0);

// good
let sum = 0;
for (const n of arr) {
  sum += n;
}
```

### unicorn/no-await-expression-member

Disallow member access on await expressions.

```js
// bad
const length = (await fetch(url)).length;

// good
const response = await fetch(url);
const length = response.length;
```

### unicorn/no-await-in-promise-methods

Disallow using `await` in `Promise.all`/`Promise.race` array items.

```js
// bad
await Promise.all([await fetch(a), await fetch(b)]);

// good
await Promise.all([fetch(a), fetch(b)]);
```

### unicorn/no-console-spaces

Disallow leading/trailing spaces inside `console.log` parameters.

```js
// bad
console.log(" hello ");

// good
console.log("hello");
```

### unicorn/no-document-cookie

Disallow `document.cookie` direct access.

```js
// bad
document.cookie = "key=value";

// good
// Use a cookie library instead
```

### unicorn/no-empty-file

Disallow empty files.

```js
// bad
// empty file

// good
export const EMPTY = "";
```

### unicorn/no-for-loop

Prefer `for...of` over `for` loops with index access.

```js
// bad
for (let i = 0; i < arr.length; i++) {}

// good
for (const item of arr) {
}
```

### unicorn/no-hex-escape

Enforce using Unicode escapes instead of hexadecimal escapes.

```js
// bad
const str = "\x1B";

// good
const str = "\u001B";
```

### unicorn/no-instanceof-array

Require `Array.isArray()` instead of `instanceof Array`.

```js
// bad
if (x instanceof Array) {
}

// good
if (Array.isArray(x)) {
}
```

### unicorn/no-invalid-fetch-options

Disallow invalid options in `fetch()`.

```js
// bad
fetch(url, { timeout: 5000 });

// good
fetch(url, { signal: AbortSignal.timeout(5000) });
```

### unicorn/no-invalid-remove-event-listener

Prevent invalid `removeEventListener` calls.

```js
// bad
el.removeEventListener("click", () => {});

// good
const handler = () => {};
el.addEventListener("click", handler);
el.removeEventListener("click", handler);
```

### unicorn/no-keyword-prefix

Disallow identifiers starting with `new` or `class`.

```js
// bad
const newValue = 1;

// good
const freshValue = 1;
```

### unicorn/no-length-as-slice-end

Disallow using `.length` as the end argument in `slice()`.

```js
// bad
const sub = arr.slice(1, arr.length);

// good
const sub = arr.slice(1);
```

### unicorn/no-lonely-if

Disallow `if` as the only statement in `else`.

```js
// bad
if (a) {
} else {
  if (b) {
  }
}

// good
if (a) {
} else if (b) {
}
```

### unicorn/no-magic-array-flat-depth

Disallow magic numbers as `flat()` depth argument.

```js
// bad
arr.flat(3);

// good
arr.flat(Infinity);
```

### unicorn/no-negated-condition

Simplify negated conditions.

```js
// bad
if (!x) {
  a();
} else {
  b();
}

// good
if (x) {
  b();
} else {
  a();
}
```

### unicorn/no-negation-in-equality-check

Disallow negation in equality checks.

```js
// bad
if (!x === y) {
}

// good
if (x !== y) {
}
```

### unicorn/no-nested-ternary

Disallow nested ternary expressions.

```js
// bad
const x = a ? (b ? c : d) : e;

// good
const inner = b ? c : d;
const x = a ? inner : e;
```

### unicorn/no-new-array

Disallow `new Array()`.

```js
// bad
const arr = new Array(10);

// good
const arr = Array.from({ length: 10 });
```

### unicorn/no-new-buffer

Disallow `new Buffer()`.

```js
// bad
const buf = new Buffer("abc");

// good
const buf = Buffer.from("abc");
```

### unicorn/no-null

Prefer `undefined` over `null`.

```js
// bad
const x = null;

// good
const x = undefined;
```

### unicorn/no-object-as-default-parameter

Disallow objects as default parameter values.

```js
// bad
function fn(opts = { x: 1 }) {}

// good
function fn({ x = 1 } = {}) {}
```

### unicorn/no-process-exit

Disallow `process.exit()`.

```js
// bad
process.exit(1);

// good
throw new Error("Fatal error");
```

### unicorn/no-single-promise-in-promise-methods

Disallow passing a single-element array to `Promise.all`.

```js
// bad
await Promise.all([fetchData()]);

// good
await fetchData();
```

### unicorn/no-static-only-class

Disallow classes with only static members.

```js
// bad
class Utils {
  static format() {}
}

// good
const format = () => {};
```

### unicorn/no-thenable

Disallow `then` property on objects.

```js
// bad
const obj = { then() {} };

// good
const obj = { resolve() {} };
```

### unicorn/no-this-assignment

Disallow assigning `this` to a variable.

```js
// bad
const self = this;

// good
const fn = () => this.value;
```

### unicorn/no-typeof-undefined

Prefer direct comparison over `typeof x === 'undefined'`.

```js
// bad
if (typeof x === "undefined") {
}

// good
if (x === undefined) {
}
```

### unicorn/no-unnecessary-await

Disallow awaiting non-promise values.

```js
// bad
const x = await "hello";

// good
const x = "hello";
```

### unicorn/no-unnecessary-polyfills

Disallow unnecessary polyfills based on target environments.

```js
// bad
import "array-flat-polyfill";

// good
// Native Array.flat is available in your target
```

### unicorn/no-unreadable-array-destructuring

Disallow unreadable array destructuring.

```js
// bad
const [, , z] = arr;

// good
const z = arr[2];
```

### unicorn/no-unreadable-iife

Disallow unreadable IIFEs.

```js
// bad
const x = (()=>({}=>{})(1))();

// good
const fn = () => {};
const x = fn();
```

### unicorn/no-unused-properties

Disallow unused object properties.

```js
// bad
const obj = { used: 1, unused: 2 };
console.log(obj.used);

// good
const obj = { used: 1 };
console.log(obj.used);
```

### unicorn/no-useless-fallback-in-spread

Disallow useless fallback in spread.

```js
// bad
const obj = { ...(x || {}) };

// good
const obj = { ...x };
```

### unicorn/no-useless-length-check

Disallow useless `length` check before array iteration.

```js
// bad
if (arr.length > 0) arr.forEach(fn);

// good
arr.forEach(fn);
```

### unicorn/no-useless-promise-resolve-reject

Disallow unnecessary `Promise.resolve` or `Promise.reject`.

```js
// bad
async function fn() {
  return Promise.resolve(1);
}

// good
async function fn() {
  return 1;
}
```

### unicorn/no-useless-spread

Disallow unnecessary spread.

```js
// bad
const arr = [...[1, 2, 3]];

// good
const arr = [1, 2, 3];
```

### unicorn/no-useless-switch-case

Disallow useless switch cases.

```js
// bad
switch (x) {
  case 1:
  default:
    handle();
}

// good
switch (x) {
  case 1:
    handleOne();
    break;
  default:
    handle();
}
```

### unicorn/no-useless-undefined

Disallow unnecessary `undefined`.

```js
// bad
function fn() {
  return undefined;
}

// good
function fn() {
  return;
}
```

### unicorn/no-zero-fractions

Disallow number literals with zero fractions.

```js
// bad
const x = 1.0;

// good
const x = 1;
```

### unicorn/number-literal-case

Enforce proper case for numeric literals.

```js
// bad
const x = 0xff;

// good
const x = 0xff;
```

### unicorn/numeric-separators-style

Enforce consistent style for numeric separators.

```js
// bad
const x = 1000000;

// good
const x = 1_000_000;
```

### unicorn/prefer-add-event-listener

Prefer `addEventListener` over `on*` properties.

```js
// bad
el.onclick = handler;

// good
el.addEventListener("click", handler);
```

### unicorn/prefer-array-find

Prefer `.find()` over `.filter()[0]`.

```js
// bad
const item = arr.filter((x) => x.id === 1)[0];

// good
const item = arr.find((x) => x.id === 1);
```

### unicorn/prefer-array-flat

Prefer `.flat()` over legacy flattening.

```js
// bad
const flat = [].concat(...nested);

// good
const flat = nested.flat();
```

### unicorn/prefer-array-flat-map

Prefer `.flatMap()` over `.map().flat()`.

```js
// bad
const result = arr.map(fn).flat();

// good
const result = arr.flatMap(fn);
```

### unicorn/prefer-array-index-of

Prefer `.indexOf()` over `.findIndex()` for simple value lookups.

```js
// bad
arr.findIndex((x) => x === val);

// good
arr.indexOf(val);
```

### unicorn/prefer-array-some

Prefer `.some()` over `.find()` or `.filter().length`.

```js
// bad
if (arr.filter((x) => x > 0).length > 0) {
}

// good
if (arr.some((x) => x > 0)) {
}
```

### unicorn/prefer-at

Prefer `.at()` for index access.

```js
// bad
const last = arr[arr.length - 1];

// good
const last = arr.at(-1);
```

### unicorn/prefer-blob-reading-methods

Prefer `Blob` reading methods over `FileReader`.

```js
// bad
const reader = new FileReader();
reader.readAsText(blob);

// good
const text = await blob.text();
```

### unicorn/prefer-code-point

Prefer `codePointAt` over `charCodeAt` and `String.fromCodePoint` over `String.fromCharCode`.

```js
// bad
str.charCodeAt(0);

// good
str.codePointAt(0);
```

### unicorn/prefer-date-now

Prefer `Date.now()` over `new Date().getTime()`.

```js
// bad
const now = new Date().getTime();

// good
const now = Date.now();
```

### unicorn/prefer-dom-node-append

Prefer `Node.append()` over `Node.appendChild()`.

```js
// bad
parent.appendChild(child);

// good
parent.append(child);
```

### unicorn/prefer-dom-node-dataset

Prefer `dataset` over `setAttribute`/`getAttribute` for data attributes.

```js
// bad
el.setAttribute("data-id", "123");

// good
el.dataset.id = "123";
```

### unicorn/prefer-dom-node-remove

Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`.

```js
// bad
parent.removeChild(child);

// good
child.remove();
```

### unicorn/prefer-dom-node-text-content

Prefer `textContent` over `innerText`.

```js
// bad
el.innerText = "hello";

// good
el.textContent = "hello";
```

### unicorn/prefer-event-target

Prefer `EventTarget` over `EventEmitter`.

```js
// bad
class Bus extends EventEmitter {}

// good
class Bus extends EventTarget {}
```

### unicorn/prefer-global-this

Prefer `globalThis` over `window` or `global`.

```js
// bad
window.setTimeout(fn, 100);

// good
globalThis.setTimeout(fn, 100);
```

### unicorn/prefer-includes

Prefer `includes()` over `indexOf() !== -1`.

```js
// bad
if (arr.indexOf(x) !== -1) {
}

// good
if (arr.includes(x)) {
}
```

### unicorn/prefer-json-parse-buffer

Prefer reading JSON from a Buffer.

```js
// bad
JSON.parse(fs.readFileSync(path, "utf8"));

// good
JSON.parse(fs.readFileSync(path));
```

### unicorn/prefer-keyboard-event-key

Prefer `KeyboardEvent.key` over `keyCode`.

```js
// bad
if (event.keyCode === 13) {
}

// good
if (event.key === "Enter") {
}
```

### unicorn/prefer-logical-operator-over-ternary

Prefer logical operators over ternary when possible.

```js
// bad
const x = a ? a : b;

// good
const x = a || b;
```

### unicorn/prefer-math-min-max

Prefer `Math.min`/`Math.max` over ternaries for clamping.

```js
// bad
const clamped = x > max ? max : x;

// good
const clamped = Math.min(x, max);
```

### unicorn/prefer-math-trunc

Prefer `Math.trunc` over bitwise alternatives.

```js
// bad
const int = x | 0;

// good
const int = Math.trunc(x);
```

### unicorn/prefer-modern-dom-apis

Prefer modern DOM APIs.

```js
// bad
el.insertBefore(newNode, refNode);

// good
refNode.before(newNode);
```

### unicorn/prefer-modern-math-apis

Prefer modern `Math` APIs.

```js
// bad
const hyp = Math.sqrt(x * x + y * y);

// good
const hyp = Math.hypot(x, y);
```

### unicorn/prefer-module

Prefer ESM over CommonJS.

```js
// bad
module.exports = foo;

// good
export default foo;
```

### unicorn/prefer-native-coercion-functions

Prefer native coercion functions over wrappers.

```js
// bad
const toStr = (x) => String(x);

// good
const toStr = String;
```

### unicorn/prefer-negative-index

Prefer negative index over length-based index.

```js
// bad
const last = str.slice(str.length - 3);

// good
const last = str.slice(-3);
```

### unicorn/prefer-node-protocol

Prefer `node:` protocol for built-in modules.

```js
// bad
import fs from "fs";

// good
import fs from "node:fs";
```

### unicorn/prefer-number-properties

Prefer `Number` static properties over global ones.

```js
// bad
if (isNaN(x)) {
}

// good
if (Number.isNaN(x)) {
}
```

### unicorn/prefer-object-from-entries

Prefer `Object.fromEntries` over manual construction.

```js
// bad
const obj = {};
pairs.forEach(([k, v]) => {
  obj[k] = v;
});

// good
const obj = Object.fromEntries(pairs);
```

### unicorn/prefer-optional-catch-binding

Prefer omitting the catch binding when unused.

```js
// bad
try {
} catch (error) {
  handleGenericError();
}

// good
try {
} catch {
  handleGenericError();
}
```

### unicorn/prefer-prototype-methods

Prefer borrowing methods from the prototype.

```js
// bad
const hasOwn = {}.hasOwnProperty;

// good
const hasOwn = Object.prototype.hasOwnProperty;
```

### unicorn/prefer-query-selector

Prefer `querySelector`/`querySelectorAll` over older methods.

```js
// bad
document.getElementById("app");

// good
document.querySelector("#app");
```

### unicorn/prefer-reflect-apply

Prefer `Reflect.apply` over `Function.prototype.apply`.

```js
// bad
fn.apply(ctx, args);

// good
Reflect.apply(fn, ctx, args);
```

### unicorn/prefer-regexp-test

Prefer `RegExp.test()` over `String.match()` for boolean results.

```js
// bad
if ("hello".match(/ell/)) {
}

// good
if (/ell/.test("hello")) {
}
```

### unicorn/prefer-set-has

Prefer `Set.has()` over `Array.includes()` for large lists.

```js
// bad
const items = [1, 2, 3];
items.includes(2);

// good
const items = new Set([1, 2, 3]);
items.has(2);
```

### unicorn/prefer-set-size

Prefer `Set.size` over converting to array and checking length.

```js
// bad
[...set].length;

// good
set.size;
```

### unicorn/prefer-spread

Prefer spread over `Array.from` and `concat`.

```js
// bad
Array.from(iterable);

// good
[...iterable];
```

### unicorn/prefer-string-raw

Prefer `String.raw` for strings with backslashes.

```js
// bad
const path = "C:\\Users\\foo";

// good
const path = String.raw`C:\Users\foo`;
```

### unicorn/prefer-string-replace-all

Prefer `replaceAll` over `replace` with global regex.

```js
// bad
str.replace(/foo/g, "bar");

// good
str.replaceAll("foo", "bar");
```

### unicorn/prefer-string-slice

Prefer `slice` over `substring`.

```js
// bad
str.substring(1, 3);

// good
str.slice(1, 3);
```

### unicorn/prefer-string-starts-ends-with

Prefer `startsWith`/`endsWith` over regex or index checks.

```js
// bad
if (str.indexOf("abc") === 0) {
}

// good
if (str.startsWith("abc")) {
}
```

### unicorn/prefer-string-trim-start-end

Prefer `trimStart`/`trimEnd` over `trimLeft`/`trimRight`.

```js
// bad
str.trimLeft();

// good
str.trimStart();
```

### unicorn/prefer-structured-clone

Prefer `structuredClone` over `JSON.parse(JSON.stringify())`.

```js
// bad
const copy = JSON.parse(JSON.stringify(obj));

// good
const copy = structuredClone(obj);
```

### unicorn/prefer-switch

Prefer `switch` over multiple `if-else-if` on the same variable.

```js
// bad
if (x === "a") {
} else if (x === "b") {
} else if (x === "c") {
}

// good
switch (x) {
  case "a":
    break;
  case "b":
    break;
  case "c":
    break;
}
```

### unicorn/prefer-ternary

Prefer ternary over simple `if-else` assignments.

```js
// bad
let x;
if (cond) {
  x = "a";
} else {
  x = "b";
}

// good
const x = cond ? "a" : "b";
```

### unicorn/prefer-top-level-await

Prefer top-level await over IIFEs.

```js
// bad
(async () => {
  await setup();
})();

// good
await setup();
```

### unicorn/prefer-type-error

Throw `TypeError` for type-checking conditions.

```js
// bad
if (typeof x !== "string") throw new Error("Expected string");

// good
if (typeof x !== "string") throw new TypeError("Expected string");
```

### unicorn/prevent-abbreviations

Enforce full words in identifiers.

```js
// bad
const btn = document.querySelector("button");

// good
const button = document.querySelector("button");
```

### unicorn/relative-url-style

Enforce consistent style for relative URL strings.

```js
// bad
new URL("./foo", base);

// good
new URL("foo", base);
```

### unicorn/require-array-join-separator

Require a separator argument in `Array.join()`.

```js
// bad
arr.join();

// good
arr.join(",");
```

### unicorn/require-number-to-fixed-digits-argument

Require a digits argument in `Number.toFixed()`.

```js
// bad
num.toFixed();

// good
num.toFixed(2);
```

### unicorn/require-post-message-target-origin

Require a `targetOrigin` argument in `postMessage`.

```js
// bad
window.postMessage(data);

// good
window.postMessage(data, "https://example.com");
```

### unicorn/switch-case-braces

Require braces in `switch` cases.

```js
// bad
switch (x) {
  case 1:
    const y = 1;
    break;
}

// good
switch (x) {
  case 1: {
    const y = 1;
    break;
  }
}
```

### unicorn/text-encoding-identifier-case

Enforce correct case for text encoding identifiers.

```js
// bad
new TextDecoder("UTF-8");

// good
new TextDecoder("utf-8");
```

### unicorn/throw-new-error

Require `new` when throwing errors.

```js
// bad
throw Error("fail");

// good
throw new Error("fail");
```

## JSX Accessibility Rules

### jsx-a11y/alt-text

Require `alt` text on images and other elements.

```jsx
// bad
<img src="photo.jpg" />

// good
<img src="photo.jpg" alt="A sunset over the ocean" />
```

### jsx-a11y/anchor-ambiguous-text

Disallow ambiguous link text like "click here".

```jsx
// bad
<a href="/docs">click here</a>

// good
<a href="/docs">Read the documentation</a>
```

### jsx-a11y/anchor-has-content

Require anchors to have content.

```jsx
// bad
<a href="/home" />

// good
<a href="/home">Home</a>
```

### jsx-a11y/anchor-is-valid

Enforce valid `href` values on anchors.

```jsx
// bad
<a href="#" onClick={handleClick}>Go</a>

// good
<button type="button" onClick={handleClick}>Go</button>
```

### jsx-a11y/aria-activedescendant-has-tabindex

Require `tabIndex` on elements with `aria-activedescendant`.

```jsx
// bad
<div aria-activedescendant="item-1" />

// good
<div aria-activedescendant="item-1" tabIndex={0} />
```

### jsx-a11y/aria-props

Enforce valid ARIA props.

```jsx
// bad
<div aria-fake="true" />

// good
<div aria-label="Menu" />
```

### jsx-a11y/aria-role

Enforce valid ARIA roles.

```jsx
// bad
<div role="datepicker" />

// good
<div role="dialog" />
```

### jsx-a11y/aria-unsupported-elements

Disallow ARIA attributes on elements that do not support them.

```jsx
// bad
<meta aria-hidden="true" />

// good
<div aria-hidden="true" />
```

### jsx-a11y/autocomplete-valid

Enforce valid `autocomplete` attribute values.

```jsx
// bad
<input autocomplete="nope" />

// good
<input autocomplete="email" />
```

### jsx-a11y/click-events-have-key-events

Require keyboard event handlers alongside `onClick`.

```jsx
// bad
<div onClick={handleClick} />

// good
<div onClick={handleClick} onKeyDown={handleKeyDown} role="button" tabIndex={0} />
```

### jsx-a11y/heading-has-content

Require headings to have content.

```jsx
// bad
<h1 />

// good
<h1>Page Title</h1>
```

### jsx-a11y/html-has-lang

Require `lang` attribute on `<html>`.

```jsx
// bad
<html />

// good
<html lang="en" />
```

### jsx-a11y/iframe-has-title

Require `title` attribute on `<iframe>`.

```jsx
// bad
<iframe src="page.html" />

// good
<iframe src="page.html" title="Embedded content" />
```

### jsx-a11y/img-redundant-alt

Disallow "image" or "photo" in `alt` text.

```jsx
// bad
<img src="dog.jpg" alt="Image of a dog" />

// good
<img src="dog.jpg" alt="A golden retriever playing fetch" />
```

### jsx-a11y/interactive-supports-focus

Require focus support on interactive elements.

```jsx
// bad
<div role="button" onClick={handleClick} />

// good
<div role="button" onClick={handleClick} tabIndex={0} />
```

### jsx-a11y/label-has-associated-control

Require labels to be associated with a control.

```jsx
// bad
<label>Name</label>
<input />

// good
<label htmlFor="name">Name</label>
<input id="name" />
```

### jsx-a11y/media-has-caption

Require `<track>` elements for `<video>` and `<audio>`.

```jsx
// bad
<video src="clip.mp4" />

// good
<video src="clip.mp4">
  <track kind="captions" src="captions.vtt" />
</video>
```

### jsx-a11y/mouse-events-have-key-events

Require keyboard events alongside mouse events.

```jsx
// bad
<div onMouseOver={handleHover} />

// good
<div onMouseOver={handleHover} onFocus={handleFocus} />
```

### jsx-a11y/no-access-key

Disallow `accessKey` prop on elements.

```jsx
// bad
<button accessKey="s">Save</button>

// good
<button type="button">Save</button>
```

### jsx-a11y/no-aria-hidden-on-focusable

Disallow `aria-hidden` on focusable elements.

```jsx
// bad
<button aria-hidden="true">Click</button>

// good
<div aria-hidden="true">Decorative</div>
```

### jsx-a11y/no-autofocus

Disallow `autoFocus` prop.

```jsx
// bad
<input autoFocus />

// good
<input />
```

### jsx-a11y/no-distracting-elements

Disallow `<marquee>` and `<blink>`.

```jsx
// bad
<marquee>Scrolling text</marquee>

// good
<p>Static text</p>
```

### jsx-a11y/no-interactive-element-to-noninteractive-role

Disallow interactive elements with non-interactive roles.

```jsx
// bad
<button role="presentation">Click</button>

// good
<div role="presentation">Content</div>
```

### jsx-a11y/no-noninteractive-element-interactions

Disallow event handlers on non-interactive elements.

```jsx
// bad
<p onClick={handleClick}>Text</p>

// good
<button type="button" onClick={handleClick}>Text</button>
```

### jsx-a11y/no-noninteractive-element-to-interactive-role

Disallow non-interactive elements with interactive roles.

```jsx
// bad
<p role="button">Click me</p>

// good
<button type="button">Click me</button>
```

### jsx-a11y/no-noninteractive-tabindex

Disallow `tabIndex` on non-interactive elements.

```jsx
// bad
<p tabIndex={0}>Text</p>

// good
<button type="button" tabIndex={0}>Text</button>
```

### jsx-a11y/no-redundant-roles

Disallow redundant roles on elements.

```jsx
// bad
<button role="button">Click</button>

// good
<button type="button">Click</button>
```

### jsx-a11y/prefer-tag-over-role

Prefer semantic HTML elements over ARIA roles.

```jsx
// bad
<div role="navigation">...</div>

// good
<nav>...</nav>
```

### jsx-a11y/role-has-required-aria-props

Require ARIA props for roles that need them.

```jsx
// bad
<div role="checkbox" />

// good
<div role="checkbox" aria-checked="false" />
```

### jsx-a11y/role-supports-aria-props

Enforce ARIA props are valid for the element role.

```jsx
// bad
<button aria-required="true" />

// good
<input aria-required="true" />
```

### jsx-a11y/scope

Enforce `scope` prop is only used on `<th>`.

```jsx
// bad
<td scope="col">Header</td>

// good
<th scope="col">Header</th>
```

### jsx-a11y/tabindex-no-positive

Disallow positive `tabIndex` values.

```jsx
// bad
<button tabIndex={5}>Click</button>

// good
<button tabIndex={0}>Click</button>
```

## Import Rules

### import/default

Ensure a default export is present when importing default.

```js
// bad
import foo from "./no-default-export";

// good
import foo from "./has-default-export";
```

### import/export

Disallow duplicate or ambiguous exports.

```js
// bad
export const x = 1;
export const x = 2;

// good
export const x = 1;
export const y = 2;
```

### import/first

Ensure all imports appear before other statements.

```js
// bad
const x = 1;
import { foo } from "mod";

// good
import { foo } from "mod";
const x = 1;
```

### import/max-dependencies

Limit the number of dependencies a module can have.

```js
// bad
// A file importing from 30+ modules

// good
// Split into focused modules with fewer imports
```

### import/named

Ensure named imports correspond to a named export.

```js
// bad
import { notExported } from "./module";

// good
import { exported } from "./module";
```

### import/namespace

Ensure namespace imports do not dereference non-existent properties.

```js
// bad
import * as mod from "./module";
mod.notExported;

// good
import * as mod from "./module";
mod.exported;
```

### import/no-absolute-path

Disallow importing with absolute file paths.

```js
// bad
import foo from "/Users/me/project/foo";

// good
import foo from "./foo";
```

### import/no-amd

Disallow AMD `require` and `define` calls.

```js
// bad
define(["dep"], (dep) => {});

// good
import dep from "dep";
```

### import/no-commonjs

Disallow CommonJS `require` calls and `module.exports`.

```js
// bad
const fs = require("fs");

// good
import fs from "node:fs";
```

### import/no-cycle

Disallow a module from importing a module with a dependency path back to itself.

```js
// bad
// a.js imports b.js, b.js imports a.js

// good
// Break circular dependencies with a shared module
```

### import/no-deprecated

Disallow importing deprecated modules.

```js
// bad
import { oldFunction } from "lib"; // @deprecated

// good
import { newFunction } from "lib";
```

### import/no-duplicates

Merge imports from the same module.

```js
// bad
import { a } from "mod";
import { b } from "mod";

// good
import { a, b } from "mod";
```

### import/no-empty-named-blocks

Disallow empty named import blocks.

```js
// bad
import {} from "mod";

// good
import { something } from "mod";
```

### import/no-extraneous-dependencies

Disallow importing packages not listed in dependencies.

```js
// bad
import test from "unlisted-package";

// good
import listed from "listed-package";
```

### import/no-mutable-exports

Disallow `let` or `var` exports.

```js
// bad
export let count = 0;

// good
export const count = 0;
```

### import/no-named-as-default

Disallow using the default import name as a named import.

```js
// bad
import Foo from "./foo"; // Foo is also a named export

// good
import { Foo } from "./foo";
```

### import/no-named-as-default-member

Disallow accessing default export properties from a named import.

```js
// bad
import foo from "./foo";
foo.bar; // bar is a named export

// good
import { bar } from "./foo";
```

### import/no-named-default

Disallow named default exports.

```js
// bad
import { default as foo } from "./foo";

// good
import foo from "./foo";
```

### import/no-rename-default

Disallow renaming default imports.

```js
// bad
import { default as MyComponent } from "./component";

// good
import MyComponent from "./component";
```

### import/no-self-import

Disallow a module from importing itself.

```js
// bad
// In foo.js: import foo from './foo';

// good
// Import from other modules only
```

### import/no-unused-modules

Disallow modules without exports or with unused exports.

```js
// bad
// A file with exports that nothing imports

// good
// All exports are consumed by other modules
```

### import/no-webpack-loader-syntax

Disallow webpack loader syntax in imports.

```js
// bad
import styles from "style-loader!css!./styles.css";

// good
import styles from "./styles.css";
```

## Next.js Rules

### nextjs/google-font-display

Enforce `display` parameter on Google Fonts.

```jsx
// bad
<link href="https://fonts.googleapis.com/css2?family=Inter" />

// good
<link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" />
```

### nextjs/google-font-preconnect

Require `preconnect` for Google Fonts.

```jsx
// bad
<link href="https://fonts.googleapis.com" />

// good
<link rel="preconnect" href="https://fonts.googleapis.com" />
```

### nextjs/inline-script-id

Require `id` attribute on `next/script` with inline content.

```jsx
// bad
<Script>{`console.log('hi')`}</Script>

// good
<Script id="analytics">{`console.log('hi')`}</Script>
```

### nextjs/next-script-for-ga

Use `next/script` for Google Analytics.

```jsx
// bad
<script async src="https://www.googletagmanager.com/gtag/js" />

// good
<Script src="https://www.googletagmanager.com/gtag/js" strategy="afterInteractive" />
```

### nextjs/no-assign-module-variable

Disallow assigning to the `module` variable.

```jsx
// bad
let module = {};

// good
let myModule = {};
```

### nextjs/no-async-client-component

Disallow async client components.

```jsx
// bad
'use client';
export default async function Page() {}

// good
'use client';
export default function Page() {}
```

### nextjs/no-before-interactive-script-outside-document

Disallow `beforeInteractive` scripts outside `_document`.

```jsx
// bad
// In pages/index.js:
<Script strategy="beforeInteractive" src="/script.js" />

// good
// In pages/_document.js:
<Script strategy="beforeInteractive" src="/script.js" />
```

### nextjs/no-css-tags

Disallow manual `<link>` stylesheet tags.

```jsx
// bad
<link rel="stylesheet" href="/styles.css" />;

// good
import "/styles.css";
```

### nextjs/no-document-import-in-page

Disallow importing `next/document` outside `_document`.

```jsx
// bad
// In pages/index.js:
import Document from "next/document";

// good
// In pages/_document.js:
import Document from "next/document";
```

### nextjs/no-duplicate-head

Disallow duplicate `<Head>` components in `_document`.

```jsx
// bad
<Head><title>A</title></Head>
<Head><meta name="desc" /></Head>

// good
<Head><title>A</title><meta name="desc" /></Head>
```

### nextjs/no-head-element

Disallow `<head>` element; use `next/head` instead.

```jsx
// bad
<head><title>Page</title></head>

// good
<Head><title>Page</title></Head>
```

### nextjs/no-head-import-in-document

Disallow `next/head` in `_document`; use `<Head>` from `next/document`.

```jsx
// bad
// In _document.js:
import Head from "next/head";

// good
// In _document.js:
import { Head } from "next/document";
```

### nextjs/no-img-element

Disallow `<img>`; use `next/image` instead.

```jsx
// bad
<img src="/photo.jpg" alt="Photo" />

// good
<Image src="/photo.jpg" alt="Photo" width={200} height={200} />
```

### nextjs/no-page-custom-font

Disallow custom fonts in individual pages.

```jsx
// bad
// In pages/about.js:
<link href="https://fonts.googleapis.com/..." />

// good
// In pages/_document.js:
<link href="https://fonts.googleapis.com/..." />
```

### nextjs/no-script-component-in-head

Disallow `next/script` inside `next/head`.

```jsx
// bad
<Head><Script src="/script.js" /></Head>

// good
<Script src="/script.js" />
```

### nextjs/no-styled-jsx-in-document

Disallow styled-jsx in `_document`.

```jsx
// bad
// In _document.js:
<style jsx>{`
  p {
    color: red;
  }
`}</style>

// good
// Use global CSS or CSS modules instead
```

### nextjs/no-sync-scripts

Disallow synchronous scripts.

```jsx
// bad
<script src="/script.js" />

// good
<Script src="/script.js" strategy="afterInteractive" />
```

### nextjs/no-title-in-document-head

Disallow `<title>` inside `next/document` `<Head>`.

```jsx
// bad
// In _document.js:
<Head><title>App</title></Head>

// good
// In pages/_app.js:
<Head><title>App</title></Head>
```

### nextjs/no-typos

Detect common typos in Next.js data fetching functions.

```jsx
// bad
export async function getServerSideProp() {}

// good
export async function getServerSideProps() {}
```

### nextjs/no-unwanted-polyfillio

Disallow polyfills already shipped with Next.js.

```jsx
// bad
<script src="https://polyfill.io/v3/polyfill.min.js?features=Array.from" />

// good
// Array.from is already available in supported browsers
```

## Promise Rules

### promise/avoid-new

Avoid creating `new Promise` when not needed.

```js
// bad
const p = new Promise((resolve) => {
  resolve(value);
});

// good
const p = Promise.resolve(value);
```

### promise/catch-or-return

Ensure promises are caught or returned.

```js
// bad
fetchData().then(handleData);

// good
fetchData().then(handleData).catch(handleError);
```

### promise/no-callback-in-promise

Disallow calling a callback inside a Promise.

```js
// bad
fetchData().then((data) => callback(null, data));

// good
fetchData().then((data) => data);
```

### promise/no-multiple-resolved

Disallow creating promises that can be resolved multiple times.

```js
// bad
new Promise((resolve) => {
  resolve(1);
  resolve(2);
});

// good
new Promise((resolve) => {
  resolve(1);
});
```

### promise/no-native

Disallow use of native Promises (for environments requiring polyfills).

```js
// bad
const p = new Promise(() => {});

// good
const p = BluebirdPromise.resolve();
```

### promise/no-nesting

Disallow nesting promises.

```js
// bad
fetch(a).then(() => fetch(b).then(() => {}));

// good
const resultA = await fetch(a);
const resultB = await fetch(b);
```

### promise/no-new-statics

Disallow `new` on Promise static methods.

```js
// bad
new Promise.resolve(1);

// good
Promise.resolve(1);
```

### promise/no-promise-in-callback

Disallow using promises inside callbacks.

```js
// bad
app.get("/", (req, res) => {
  fetch(url).then((data) => res.json(data));
});

// good
app.get("/", async (req, res) => {
  const data = await fetch(url);
  res.json(data);
});
```

### promise/no-return-in-finally

Disallow return statements in `finally`.

```js
// bad
promise.finally(() => {
  return cleanup;
});

// good
promise.finally(() => {
  cleanup();
});
```

### promise/no-return-wrap

Disallow wrapping values in `Promise.resolve`/`Promise.reject` in `then`/`catch`.

```js
// bad
promise.then(() => Promise.resolve(1));

// good
promise.then(() => 1);
```

### promise/param-names

Enforce standard parameter names for Promise constructors.

```js
// bad
new Promise((res, rej) => {});

// good
new Promise((resolve, reject) => {});
```

### promise/prefer-await-to-callbacks

Prefer `async`/`await` over callbacks.

```js
// bad
readFile("file.txt", (err, data) => {});

// good
const data = await readFile("file.txt");
```

### promise/prefer-await-to-then

Prefer `await` over `.then()`.

```js
// bad
fetchData().then((data) => process(data));

// good
const data = await fetchData();
process(data);
```

### promise/spec-only

Disallow use of non-standard Promise methods.

```js
// bad
Promise.delay(100);

// good
await new Promise((resolve) => setTimeout(resolve, 100));
```

### promise/valid-params

Ensure correct number of arguments to Promise methods.

```js
// bad
Promise.all();

// good
Promise.all([p1, p2]);
```

## Oxc Rules

### oxc/approx-constant

Disallow approximate representations of mathematical constants.

```js
// bad
const pi = 3.141592;

// good
const pi = Math.PI;
```

### oxc/bad-array-method-on-arguments

Disallow calling array methods on `arguments`.

```js
// bad
function fn() {
  arguments.map((x) => x);
}

// good
function fn(...args) {
  args.map((x) => x);
}
```

### oxc/bad-match-all-arg

Require the global flag on regular expressions passed to `matchAll`; without it the call throws at runtime.

```js
// bad
str.matchAll(/x/);

// good
str.matchAll(/x/gv);
```

### oxc/bad-bitwise-operator

Flag potentially incorrect bitwise operators.

```js
// bad
if (x | (0 === 0)) {
}

// good
if ((x | 0) === 0) {
}
```

### oxc/bad-char-at-comparison

Disallow incorrect `charAt` comparisons.

```js
// bad
if (str.charAt(0) === "ab") {
}

// good
if (str.charAt(0) === "a") {
}
```

### oxc/bad-comparison-sequence

Disallow comparison chains that do not work as intended.

```js
// bad
if (a < b < c) {
}

// good
if (a < b && b < c) {
}
```

### oxc/bad-min-max-func

Disallow incorrect `Math.min`/`Math.max` combinations.

```js
// bad
Math.min(Math.max(x, 100), 0);

// good
Math.min(Math.max(x, 0), 100);
```

### oxc/bad-object-literal-comparison

Disallow comparing against object literals that always create new references.

```js
// bad
if (x === {}) {
}

// good
if (Object.keys(x).length === 0) {
}
```

### oxc/bad-replace-all-arg

Disallow incorrect arguments to `replaceAll`.

```js
// bad
str.replaceAll(/foo/, "bar");

// good
str.replaceAll(/foo/g, "bar");
```

### oxc/const-comparisons

Disallow redundant comparisons involving constants.

```js
// bad
if (x >= 0 && x >= 1) {
}

// good
if (x >= 1) {
}
```

### oxc/double-comparisons

Simplify double comparisons.

```js
// bad
if (x === y || x < y) {
}

// good
if (x <= y) {
}
```

### oxc/erasing-op

Disallow operations that always produce a constant result.

```js
// bad
const x = y * 0;

// good
const x = 0;
```

### oxc/missing-throw

Detect missing `throw` before `new Error()`.

```js
// bad
function fail() {
  new Error("fail");
}

// good
function fail() {
  throw new Error("fail");
}
```

### oxc/misrefactored-assign-op

Detect mistaken compound assignment refactoring.

```js
// bad
x = x + x + 1; // Probably meant x += 1

// good
x += 1;
```

### oxc/no-accumulating-spread

Disallow spreading in a loop that accumulates.

```js
// bad
let result = [];
for (const item of items) {
  result = [...result, item];
}

// good
const result = [];
for (const item of items) {
  result.push(item);
}
```

### oxc/no-barrel-file

Disallow barrel files that re-export everything.

```js
// bad
export * from "./a";
export * from "./b";

// good
export { specific } from "./a";
```

### oxc/number-arg-out-of-range

Disallow numeric arguments outside the allowed range.

```js
// bad
const x = Number.parseInt("ff", 37);

// good
const x = Number.parseInt("ff", 16);
```

### oxc/only-used-in-recursion

Flag parameters only used in recursive calls.

```js
// bad
function fn(a, b) {
  return fn(a, b - 1);
}

// good
function fn(b) {
  return fn(b - 1);
}
```

### oxc/uninvoked-array-callback

Detect array callbacks that are referenced but not invoked.

```js
// bad
arr.forEach(console.log);

// good
arr.forEach((x) => console.log(x));
```

## Node Rules

### node/exports-style

Require `module.exports` over the `exports` alias in CommonJS files.

```js
// bad
exports.foo = 1;

// good
module.exports = { foo: 1 };
```

### node/handle-callback-err

Require error handling in callbacks.

```js
// bad
fs.readFile("f", (err, data) => {
  use(data);
});

// good
fs.readFile("f", (err, data) => {
  if (err) throw err;
  use(data);
});
```

### node/no-exports-assign

Disallow assigning to `exports`.

```js
// bad
exports = { foo: 1 };

// good
module.exports = { foo: 1 };
```

### node/no-new-require

Disallow `new require()`.

```js
// bad
const app = new require("express")();

// good
const express = require("express");
const app = express();
```

### node/no-path-concat

Disallow string concatenation with `__dirname` and `__filename`; use `path.join` so paths work on every platform.

```js
// bad
const file = __dirname + "/config.json";

// good
const file = path.join(__dirname, "config.json");
```

### node/no-process-env

Disallow `process.env` usage directly; use a config module.

```js
// bad
const port = process.env.PORT;

// good
import { config } from "./config";
const port = config.port;
```

### node/no-restricted-import

Disallow specified modules when loaded by `import`.

```js
// bad
import banned from "banned-module";

// good
import allowed from "allowed-module";
```

### node/prefer-global/text-decoder

Prefer the global `TextDecoder` over `require('util').TextDecoder`.

```js
// bad
const { TextDecoder } = require("util");

// good
const decoder = new TextDecoder();
```

## Perfectionist Rules

### perfectionist/sort-enums

Sort enum members alphabetically by value, with partition-by-comment support.

### perfectionist/sort-heritage-clauses

Sort `extends` and `implements` clauses alphabetically.

### perfectionist/sort-interfaces

Sort interface and type members alphabetically.

### perfectionist/sort-jsx-props

Sort JSX props alphabetically.

### perfectionist/sort-object-types

Sort members of object type annotations alphabetically.

### perfectionist/sort-objects

Sort object keys alphabetically, with partition-by-comment support.

## Other JS Plugin Rules

### react-hooks/exhaustive-deps

Verify the dependency array for React Hooks like `useEffect`, `useMemo`, and `useCallback` includes all referenced reactive values.

### react-hooks/rules-of-hooks

Enforce that Hooks are only called at the top level of a function component or custom Hook, never inside loops, conditions, or nested functions.

### no-only-tests/no-only-tests

Disallow `.only` in test files to prevent accidentally committing focused tests that skip the rest of the suite.

### unused-imports/no-unused-imports

Automatically remove import statements that are not referenced anywhere in the file.

## Anti-Slop Rules

Vendored from [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) (MIT) until upstream publishes to npm. These reject patterns that fake type evidence instead of establishing it: the assertion and widening escape hatches AI-generated code reaches for beyond plain `any`.

### anti-slop/no-chained-type-assertions

Disallow chained type assertions that launder a value into an unrelated type. Severity: `error`.

```ts
// bad
const user = JSON.parse(raw) as unknown as User;

// good
const user = userSchema.parse(JSON.parse(raw));
```

### anti-slop/no-conditional-empty-object-spread

Disallow spreading a conditional that falls back to an empty object to omit fields. Severity: `error`.

```ts
// bad
const payload = { ...(id !== undefined ? { id } : {}) };

// good
const payload = { id };
```

### anti-slop/no-known-value-widening

Disallow annotating a known value with a broad type that discards what TypeScript already inferred. Severity: `error`.

```ts
// bad
const mode: string = "dark";

// good
const mode = "dark";
```

### anti-slop/no-object-parameters

Disallow the broad `object` type on function parameters. Severity: `error`.

```ts
// bad
const track = (event: object) => send(event);

// good
const track = (event: AnalyticsEvent) => send(event);
```

### anti-slop/no-runtime-typeof

Disallow runtime `typeof` checks in favor of parsing at the I/O boundary. Severity: `off` in this config: the rule flags every `typeof`, including the `typeof window` SSR guards other enabled rules steer toward and ordinary `typeof x === "string"` narrowing.

```ts
// what it would flag
if (typeof input === "string") {
  use(input);
}

// what it wants
const parsed = inputSchema.parse(input);
use(parsed);
```

### anti-slop/no-shape-in-symbol-names

Disallow the case-insensitive substring "shape" in symbol names. Severity: `warn`, not error, because it also matches zod's `schema.shape` introspection API.

```ts
// bad
const responseShape = { id: 0 };

// good
const response = { id: 0 };
```

### anti-slop/no-unknown-parameters

Disallow `unknown` function parameters except the `cause` convention; decode input at its I/O boundary instead. Severity: `warn`, not error, because `use-unknown-in-catch-callback-variable` autofixes catch callbacks to the exact `(err: unknown)` annotation this rule flags.

```ts
// bad
const handle = (value: unknown) => process(value);

// good
const handle = (value: Payload) => process(value);
```

### anti-slop/no-unknown-type-aliases

Disallow type aliases that only rename `unknown`. Severity: `error`.

```ts
// bad
type Payload = unknown;

// good
type Payload = { id: string; body: string };
```

### anti-slop/no-unsafe-dictionary-type

Disallow dictionary value types that are `unknown`, `any`, `object`, or `{}`. Severity: `error`.

```ts
// bad
type Flags = Record<string, unknown>;

// good
type Flags = Record<string, boolean>;
```

### anti-slop/no-widen-then-assert

Disallow widening a known value and then asserting it back to a narrow type. Severity: `error`.

```ts
// bad
const status: string = "active";
use(status as "active");

// good
const status = "active";
use(status);
```

## Awesomeness Rules

First-party rules that ship with this config.

### awesomeness/no-novel-comments

Disallow block comments or contiguous runs of line comments longer than 5 lines. Directive comments (`eslint-`, `oxlint-`, `@ts-`, and similar) and license headers are exempt. Severity: `error`.

```ts
// bad
// This helper takes the list of users we fetched earlier,
// checks each one to see whether the account is active,
// then maps over the remaining users to pull out their emails,
// lowercases each email so comparisons behave consistently,
// sorts the result alphabetically for stable output,
// and finally returns the deduplicated list to the caller.
const activeEmails = (users: Array<User>) => dedupe(sortedEmails(users));

// good
// Dedupe AFTER lowercasing: the upstream CRM exports mixed-case duplicates.
const activeEmails = (users: Array<User>) => dedupe(sortedEmails(users));
```

## React Doctor Rules

Original diagnostics from [oxlint-plugin-react-doctor](https://www.npmjs.com/package/oxlint-plugin-react-doctor), enabled at upstream severities: `warn` means advisory, `error` means definite bug. Ports of native react/jsx-a11y/react-hooks rules already covered above are excluded, as are rules gated on libraries the fleet does not ship.

## React Doctor: Accessibility

### react-doctor/anchor-target-exists

Require in-page anchor links to point at an element that exists. Severity: `warn`.

```tsx
// bad
<a href="#pricing">Pricing</a>
// no element with id="pricing" is rendered

// good
<a href="#pricing">Pricing</a>
<section id="pricing">…</section>
```

### react-doctor/aria-braille-equivalent

Require elements using `aria-braillelabel` or `aria-brailleroledescription` to also have a matching non-braille equivalent. Severity: `warn`.

```tsx
// bad
<button aria-braillelabel="btn">Save</button>

// good
<button aria-label="Save" aria-braillelabel="Save">Save</button>
```

### react-doctor/data-table-requires-accessible-name

Require data tables to have an accessible name via `<caption>`, `aria-label`, or `aria-labelledby`. Severity: `warn`.

```tsx
// bad
<table>
  <tr><th>Name</th><th>Price</th></tr>
</table>

// good
<table aria-label="Product prices">
  <tr><th>Name</th><th>Price</th></tr>
</table>
```

### react-doctor/details-requires-summary

Require `<details>` elements to contain a `<summary>` child. Severity: `warn`.

```tsx
// bad
<details>
  <p>Shipping takes 3 to 5 days.</p>
</details>

// good
<details>
  <summary>Shipping info</summary>
  <p>Shipping takes 3 to 5 days.</p>
</details>
```

### react-doctor/dialog-has-accessible-name

Require dialogs to have an accessible name via `aria-label` or `aria-labelledby`. Severity: `warn`.

```tsx
// bad
<div role="dialog">…</div>

// good
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm deletion</h2>
</div>
```

### react-doctor/empty-table-header

Disallow empty `<th>` elements in table headers. Severity: `warn`.

```tsx
// bad
<tr><th></th><th>Price</th></tr>

// good
<tr><th>Name</th><th>Price</th></tr>
```

### react-doctor/fieldset-requires-legend

Require `<fieldset>` elements to contain a `<legend>`. Severity: `warn`.

```tsx
// bad
<fieldset>
  <input type="radio" name="plan" /> Basic
</fieldset>

// good
<fieldset>
  <legend>Plan</legend>
  <input type="radio" name="plan" /> Basic
</fieldset>
```

### react-doctor/html-xml-lang-mismatch

Require `lang` and `xml:lang` attributes on `<html>` to match. Severity: `warn`.

```tsx
// bad
<html lang="en" xml:lang="fr" />

// good
<html lang="en" xml:lang="en" />
```

### react-doctor/iframe-title-unique

Require each `<iframe>` title to be unique within the page. Severity: `warn`.

```tsx
// bad
<iframe title="Embedded content" src="/map" />
<iframe title="Embedded content" src="/video" />

// good
<iframe title="Store location map" src="/map" />
<iframe title="Product demo video" src="/video" />
```

### react-doctor/loading-action-preserves-trigger

Require the control that triggered an async action to stay rendered in a loading state instead of being swapped out. Severity: `warn`.

```tsx
// bad
{
  isSaving ? <Spinner /> : <button onClick={save}>Save</button>;
}

// good
<button onClick={save} disabled={isSaving}>
  {isSaving ? <Spinner /> : null} Save
</button>;
```

### react-doctor/no-all-caps-body-text

Disallow all-caps styling on body text. Severity: `warn`.

```tsx
// bad
<p style={{ textTransform: "uppercase" }}>Read our full terms of service.</p>

// good
<p>Read our full terms of service.</p>
```

### react-doctor/no-arbitrary-px-font-size

Disallow arbitrary pixel font sizes; use relative units or scale tokens. Severity: `warn`.

```tsx
// bad
<p style={{ fontSize: "13px" }}>Details</p>

// good
<p style={{ fontSize: "0.875rem" }}>Details</p>
```

### react-doctor/no-aria-hidden-on-body

Disallow `aria-hidden` on the `<body>` element. Severity: `error`.

```tsx
// bad
<body aria-hidden="true">…</body>

// good
<body>…</body>
```

### react-doctor/no-aria-invalid-without-description

Require inputs marked `aria-invalid` to reference an error description. Severity: `warn`.

```tsx
// bad
<input aria-invalid="true" />

// good
<input aria-invalid="true" aria-describedby="email-error" />
<p id="email-error">Enter a valid email address.</p>
```

### react-doctor/no-assertive-status

Disallow `aria-live="assertive"` or `role="alert"` for non-critical status updates. Severity: `warn`.

```tsx
// bad
<div role="alert">3 results found</div>

// good
<div role="status">3 results found</div>
```

### react-doctor/no-autoplay-without-muted

Disallow autoplaying media that is not muted. Severity: `warn`.

```tsx
// bad
<video autoPlay src="/intro.mp4" />

// good
<video autoPlay muted src="/intro.mp4" />
```

### react-doctor/no-blocked-paste

Disallow blocking paste on inputs. Severity: `error`.

```tsx
// bad
<input onPaste={(e) => e.preventDefault()} />

// good
<input />
```

### react-doctor/no-controlled-selection-focus-effect

Disallow effects that move focus in response to controlled selection changes. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  itemRefs.current[selectedIndex]?.focus();
}, [selectedIndex]);

// good
const handleKeyDown = (e) => {
  if (e.key === "ArrowDown") itemRefs.current[selectedIndex + 1]?.focus();
};
```

### react-doctor/no-cramped-container-padding

Disallow containers with padding too small for their content. Severity: `warn`.

```tsx
// bad
<div style={{ padding: "1px", border: "1px solid" }}>Card content</div>

// good
<div style={{ padding: "16px", border: "1px solid" }}>Card content</div>
```

### react-doctor/no-crushed-letter-spacing

Disallow negative letter spacing that crushes text legibility. Severity: `warn`.

```tsx
// bad
<p style={{ letterSpacing: "-0.1em" }}>Terms and conditions</p>

// good
<p style={{ letterSpacing: "normal" }}>Terms and conditions</p>
```

### react-doctor/no-duplicate-static-id-reference

Disallow multiple rendered elements sharing the same static `id` referenced by ARIA attributes. Severity: `error`.

```tsx
// bad
{
  items.map((item) => <input key={item.id} id="field" aria-describedby="hint" />);
}

// good
{
  items.map((item) => (
    <input key={item.id} id={`field-${item.id}`} aria-describedby={`hint-${item.id}`} />
  ));
}
```

### react-doctor/no-focus-in-animation-completion-handler

Disallow moving focus inside animation completion handlers. Severity: `warn`.

```tsx
// bad
<div onAnimationEnd={() => inputRef.current?.focus()} />;

// good
useEffect(() => {
  if (isOpen) inputRef.current?.focus();
}, [isOpen]);
```

### react-doctor/no-focusable-content-in-aria-hidden

Disallow focusable elements inside `aria-hidden` containers. Severity: `warn`.

```tsx
// bad
<div aria-hidden="true">
  <button>Close</button>
</div>

// good
<div aria-hidden="true" inert="">
  <button tabIndex={-1}>Close</button>
</div>
```

### react-doctor/no-focusable-content-in-role-text

Disallow focusable elements inside containers with `role="text"`. Severity: `warn`.

```tsx
// bad
<span role="text">
  Read the <a href="/terms">terms</a>
</span>

// good
<span>
  Read the <a href="/terms">terms</a>
</span>
```

### react-doctor/no-hover-only-reveal

Disallow revealing interactive content on hover only, without a focus or keyboard equivalent. Severity: `warn`.

```tsx
// bad
<div className="group">
  <button className="opacity-0 group-hover:opacity-100">Delete</button>
</div>

// good
<div className="group">
  <button className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100">Delete</button>
</div>
```

### react-doctor/no-inert-pointer-affordance

Disallow pointer affordances like `cursor: pointer` on non-interactive elements. Severity: `warn`.

```tsx
// bad
<div style={{ cursor: "pointer" }} onClick={open}>Open</div>

// good
<button onClick={open}>Open</button>
```

### react-doctor/no-invalid-progress-range

Disallow progress values outside the declared min/max range. Severity: `error`.

```tsx
// bad
<div role="progressbar" aria-valuenow={150} aria-valuemin={0} aria-valuemax={100} />

// good
<div role="progressbar" aria-valuenow={75} aria-valuemin={0} aria-valuemax={100} />
```

### react-doctor/no-invisible-focus-control

Disallow focusable controls that are visually hidden while remaining in the tab order. Severity: `warn`.

```tsx
// bad
<button style={{ opacity: 0 }}>Submit</button>

// good
<button style={{ opacity: 0 }} tabIndex={-1} aria-hidden="true">Submit</button>
```

### react-doctor/no-low-contrast-inline-style

Disallow inline styles with insufficient text contrast. Severity: `warn`.

```tsx
// bad
<p style={{ color: "#bbbbbb", background: "#ffffff" }}>Notice</p>

// good
<p style={{ color: "#444444", background: "#ffffff" }}>Notice</p>
```

### react-doctor/no-multiple-main-landmarks

Disallow more than one `<main>` landmark per page. Severity: `warn`.

```tsx
// bad
<main>Primary content</main>
<main>Secondary content</main>

// good
<main>Primary content</main>
<section aria-label="Related">Secondary content</section>
```

### react-doctor/no-multiple-unlabeled-navigation-landmarks

Require multiple navigation landmarks on a page to have distinguishing labels. Severity: `warn`.

```tsx
// bad
<nav>…</nav>
<nav>…</nav>

// good
<nav aria-label="Primary">…</nav>
<nav aria-label="Footer">…</nav>
```

### react-doctor/no-nonresizable-textarea

Disallow disabling resize on textareas. Severity: `warn`.

```tsx
// bad
<textarea style={{ resize: "none" }} />

// good
<textarea style={{ resize: "vertical" }} />
```

### react-doctor/no-overwide-text-measure

Disallow text containers wider than a readable line length. Severity: `warn`.

```tsx
// bad
<p style={{ maxWidth: "1200px" }}>Long article paragraph…</p>

// good
<p style={{ maxWidth: "65ch" }}>Long article paragraph…</p>
```

### react-doctor/no-placeholder-only-field

Disallow using a placeholder as the only label for a form field. Severity: `warn`.

```tsx
// bad
<input placeholder="Email" />

// good
<label htmlFor="email">Email</label>
<input id="email" placeholder="name@example.com" />
```

### react-doctor/no-pointer-disabled-enabled-control

Disallow `pointer-events: none` on controls that are still enabled and focusable. Severity: `warn`.

```tsx
// bad
<button style={{ pointerEvents: "none" }}>Save</button>

// good
<button disabled>Save</button>
```

### react-doctor/no-presentation-role-conflict

Disallow `role="presentation"` or `role="none"` on elements with ARIA attributes or interactivity. Severity: `warn`.

```tsx
// bad
<img role="presentation" alt="Company logo" />

// good
<img role="presentation" alt="" />
```

### react-doctor/no-reduced-motion-content-removal

Disallow hiding content entirely under `prefers-reduced-motion` instead of reducing its motion. Severity: `warn`.

```tsx
// bad
<div className="motion-reduce:hidden animate-fade-in">Announcement</div>

// good
<div className="motion-reduce:animate-none animate-fade-in">Announcement</div>
```

### react-doctor/no-responsive-hidden-accessible-name

Disallow hiding a control's only accessible name at some breakpoints. Severity: `warn`.

```tsx
// bad
<button>
  <TrashIcon />
  <span className="hidden md:inline">Delete</span>
</button>

// good
<button aria-label="Delete">
  <TrashIcon />
  <span className="hidden md:inline">Delete</span>
</button>
```

### react-doctor/no-server-side-image-map

Disallow server-side image maps. Severity: `warn`.

```tsx
// bad
<a href="/map"><img src="/regions.png" ismap /></a>

// good
<img src="/regions.png" useMap="#regions" />
```

### react-doctor/no-skipped-heading-level

Disallow skipping heading levels. Severity: `warn`.

```tsx
// bad
<h1>Dashboard</h1>
<h3>Recent activity</h3>

// good
<h1>Dashboard</h1>
<h2>Recent activity</h2>
```

### react-doctor/no-small-form-control-text

Disallow form control text smaller than a legible size. Severity: `warn`.

```tsx
// bad
<input style={{ fontSize: "11px" }} />

// good
<input style={{ fontSize: "16px" }} />
```

### react-doctor/no-smooth-scroll-without-reduced-motion

Disallow smooth scrolling without a `prefers-reduced-motion` gate. Severity: `warn`.

```tsx
// bad
window.scrollTo({ top: 0, behavior: "smooth" });

// good
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
```

### react-doctor/no-tight-body-leading

Disallow body text line height below a readable minimum. Severity: `warn`.

```tsx
// bad
<p style={{ lineHeight: 1.1 }}>Long paragraph of body copy…</p>

// good
<p style={{ lineHeight: 1.5 }}>Long paragraph of body copy…</p>
```

### react-doctor/no-transitioned-composite-widget-state

Disallow CSS transitions on composite widget state changes like selection or expansion. Severity: `warn`.

```tsx
// bad
<li role="option" className="transition-all" aria-selected={isSelected}>…</li>

// good
<li role="option" aria-selected={isSelected}>…</li>
```

### react-doctor/no-transitioned-focus-ring

Disallow transitioning the focus ring; focus indication must appear instantly. Severity: `warn`.

```tsx
// bad
<button className="transition-all focus-visible:ring-2">Save</button>

// good
<button className="transition-colors focus-visible:ring-2">Save</button>
```

### react-doctor/no-undersized-icon-button

Disallow icon-only buttons with hit targets smaller than the minimum size. Severity: `warn`.

```tsx
// bad
<button aria-label="Close" style={{ width: 16, height: 16 }}><XIcon /></button>

// good
<button aria-label="Close" style={{ width: 44, height: 44 }}><XIcon /></button>
```

### react-doctor/no-ungated-tailwind-animation

Require Tailwind `animate-*` classes to be gated with a `motion-reduce` variant. Severity: `warn`.

```tsx
// bad
<div className="animate-bounce">New</div>

// good
<div className="animate-bounce motion-reduce:animate-none">New</div>
```

### react-doctor/no-uninformative-aria-label

Disallow `aria-label` values that add no information, like "button" or "image". Severity: `warn`.

```tsx
// bad
<button aria-label="button"><TrashIcon /></button>

// good
<button aria-label="Delete item"><TrashIcon /></button>
```

### react-doctor/radio-input-missing-name

Require radio inputs to have a `name` so they form a group. Severity: `warn`.

```tsx
// bad
<input type="radio" value="basic" />
<input type="radio" value="pro" />

// good
<input type="radio" name="plan" value="basic" />
<input type="radio" name="plan" value="pro" />
```

### react-doctor/role-button-requires-complete-keyboard-activation

Require elements with `role="button"` to handle both Enter and Space activation. Severity: `warn`.

```tsx
// bad
<div role="button" tabIndex={0} onClick={submit}>Submit</div>

// good
<div
  role="button"
  tabIndex={0}
  onClick={submit}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") submit();
  }}
>
  Submit
</div>
```

## React Doctor: Architecture

### react-doctor/no-giant-component

Disallow components that grow beyond a maintainable size. Severity: `warn`.

```tsx
// bad
const Dashboard = () => {
  // hundreds of lines of state, effects, and JSX in one component
};

// good
const Dashboard = () => (
  <>
    <DashboardHeader />
    <DashboardStats />
    <DashboardFeed />
  </>
);
```

### react-doctor/no-legacy-class-lifecycles

Disallow legacy class lifecycle methods like `componentWillMount` and `componentWillReceiveProps`. Severity: `error`.

```tsx
// bad
class Panel extends React.Component {
  componentWillReceiveProps(next) {
    this.setState({ value: next.value });
  }
}

// good
const Panel = ({ value }) => <div>{value}</div>;
```

### react-doctor/no-legacy-context-api

Disallow the legacy context API (`childContextTypes`, `getChildContext`, `contextTypes`). Severity: `error`.

```tsx
// bad
class Provider extends React.Component {
  getChildContext() {
    return { theme: "dark" };
  }
}

// good
const ThemeContext = React.createContext("dark");
<ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>;
```

### react-doctor/no-many-boolean-props

Disallow components that take many boolean props; use a variant prop instead. Severity: `warn`.

```tsx
// bad
<Button primary large rounded outlined disabled />

// good
<Button variant="primary" size="large" shape="rounded" disabled />
```

### react-doctor/no-nested-component-definition

Disallow defining a component inside another component's render. Severity: `error`.

```tsx
// bad
const List = ({ items }) => {
  const Row = ({ item }) => <li>{item.name}</li>;
  return (
    <ul>
      {items.map((i) => (
        <Row key={i.id} item={i} />
      ))}
    </ul>
  );
};

// good
const Row = ({ item }) => <li>{item.name}</li>;
const List = ({ items }) => (
  <ul>
    {items.map((i) => (
      <Row key={i.id} item={i} />
    ))}
  </ul>
);
```

### react-doctor/no-react-dom-deprecated-apis

Disallow deprecated ReactDOM APIs like `render` and `hydrate`. Severity: `warn`.

```tsx
// bad
ReactDOM.render(<App />, document.getElementById("root"));

// good
createRoot(document.getElementById("root")).render(<App />);
```

### react-doctor/no-react19-deprecated-apis

Disallow APIs removed or deprecated in React 19, like `defaultProps` on functions and string refs. Severity: `warn`.

```tsx
// bad
const Badge = ({ label }) => <span>{label}</span>;
Badge.defaultProps = { label: "New" };

// good
const Badge = ({ label = "New" }) => <span>{label}</span>;
```

### react-doctor/no-render-in-render

Disallow calling a component as a plain function inside render. Severity: `warn`.

```tsx
// bad
<div>{Header({ title })}</div>

// good
<div><Header title={title} /></div>
```

### react-doctor/no-render-prop-children

Disallow passing a function as `children` when composition works. Severity: `warn`.

```tsx
// bad
<Card>{() => <p>Content</p>}</Card>

// good
<Card><p>Content</p></Card>
```

### react-doctor/prefer-explicit-variants

Prefer an explicit variant string prop over combinations of boolean flags. Severity: `warn`.

```tsx
// bad
<Alert isError={!isWarning} isWarning={isWarning} />

// good
<Alert variant={isWarning ? "warning" : "error"} />
```

### react-doctor/prefer-module-scope-pure-function

Prefer moving pure functions that use no component state to module scope. Severity: `warn`.

```tsx
// bad
const Price = ({ cents }) => {
  const format = (n) => `$${(n / 100).toFixed(2)}`;
  return <span>{format(cents)}</span>;
};

// good
const format = (n) => `$${(n / 100).toFixed(2)}`;
const Price = ({ cents }) => <span>{format(cents)}</span>;
```

### react-doctor/prefer-module-scope-static-value

Prefer moving static values that never change to module scope. Severity: `warn`.

```tsx
// bad
const Menu = () => {
  const items = ["Home", "About", "Contact"];
  return <Nav items={items} />;
};

// good
const ITEMS = ["Home", "About", "Contact"];
const Menu = () => <Nav items={ITEMS} />;
```

## React Doctor: Correctness

### react-doctor/html-no-invalid-paragraph-child

Disallow block-level elements as children of `<p>`. Severity: `warn`.

```tsx
// bad
<p>Summary <div>Details</div></p>

// good
<p>Summary</p>
<div>Details</div>
```

### react-doctor/html-no-invalid-table-nesting

Disallow invalid nesting inside tables, like a `<div>` directly in a `<table>`. Severity: `warn`.

```tsx
// bad
<table><div>Row</div></table>

// good
<table><tbody><tr><td>Row</td></tr></tbody></table>
```

### react-doctor/html-no-nested-interactive

Disallow nesting interactive elements inside other interactive elements. Severity: `warn`.

```tsx
// bad
<button><a href="/docs">Docs</a></button>

// good
<a href="/docs">Docs</a>
```

### react-doctor/no-jsx-element-type

Disallow `JSX.Element` as a prop or return type; use `ReactNode` or `ReactElement`. Severity: `error`.

```ts
// bad
type Props = { icon: JSX.Element };

// good
type Props = { icon: ReactNode };
```

### react-doctor/no-polymorphic-children

Disallow children whose type changes shape depending on props. Severity: `warn`.

```tsx
// bad
<Button as="a">{isLink ? <a href="/docs">Docs</a> : "Docs"}</Button>;

// good
{
  isLink ? (
    <Button as="a" href="/docs">
      Docs
    </Button>
  ) : (
    <Button>Docs</Button>
  );
}
```

### react-doctor/no-prevent-default

Disallow calling `preventDefault` where it breaks native behavior instead of using the proper alternative. Severity: `warn`.

```tsx
// bad
<a href="/docs" onClick={(e) => { e.preventDefault(); navigate("/docs"); }}>Docs</a>

// good
<Link href="/docs">Docs</Link>
```

### react-doctor/no-random-key

Disallow random values like `Math.random()` or `crypto.randomUUID()` as `key`. Severity: `error`.

```tsx
// bad
{
  items.map((item) => <Row key={Math.random()} item={item} />);
}

// good
{
  items.map((item) => <Row key={item.id} item={item} />);
}
```

### react-doctor/no-uncontrolled-input

Disallow inputs that flip between controlled and uncontrolled. Severity: `warn`.

```tsx
// bad
<input value={value} />

// good
<input value={value ?? ""} onChange={(e) => setValue(e.target.value)} />
```

### react-doctor/rendering-conditional-render

Require conditional rendering that cannot leak falsy values like `0` into the output. Severity: `warn`.

```tsx
// bad
{
  items.length && <List items={items} />;
}

// good
{
  items.length > 0 && <List items={items} />;
}
```

### react-doctor/rendering-svg-precision

Disallow excessive decimal precision in SVG path coordinates. Severity: `warn`.

```tsx
// bad
<path d="M 12.000000381469727 3.9999998211860657 L 20.00000015 12.0000004" />

// good
<path d="M 12 4 L 20 12" />
```

## React Doctor: Design and UX

### react-doctor/no-disabled-zoom

Disallow disabling user zoom in the viewport meta tag. Severity: `error`.

```tsx
// bad
<meta name="viewport" content="width=device-width, user-scalable=no" />

// good
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### react-doctor/no-gray-on-colored-background

Disallow gray text on colored backgrounds. Severity: `warn`.

```tsx
// bad
<div className="bg-blue-600 text-gray-400">Get started</div>

// good
<div className="bg-blue-600 text-blue-100">Get started</div>
```

### react-doctor/no-inline-bounce-easing

Disallow inline bounce or elastic easing curves. Severity: `warn`.

```tsx
// bad
<div style={{ transition: "transform 300ms cubic-bezier(0.68, -0.55, 0.27, 1.55)" }} />

// good
<div style={{ transition: "transform 300ms ease-out" }} />
```

### react-doctor/no-inline-exhaustive-style

Disallow sprawling inline style objects that should be extracted. Severity: `warn`.

```tsx
// bad
<div style={{ display: "flex", gap: 8, padding: 16, borderRadius: 8, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.1)", border: "1px solid #eee" }} />

// good
<div className="card" />
```

### react-doctor/no-layout-transition-inline

Disallow inline transitions on layout properties like `width`, `height`, or `top`. Severity: `warn`.

```tsx
// bad
<div style={{ transition: "width 200ms" }} />

// good
<div style={{ transition: "transform 200ms" }} />
```

### react-doctor/no-long-transition-duration

Disallow transition durations long enough to feel sluggish. Severity: `warn`.

```tsx
// bad
<div style={{ transition: "opacity 2000ms" }} />

// good
<div style={{ transition: "opacity 200ms" }} />
```

### react-doctor/no-outline-none

Disallow removing the focus outline without providing a visible replacement. Severity: `warn`.

```tsx
// bad
<button style={{ outline: "none" }}>Save</button>

// good
<button className="focus-visible:ring-2">Save</button>
```

### react-doctor/no-tiny-text

Disallow text smaller than a legible minimum size. Severity: `warn`.

```tsx
// bad
<span style={{ fontSize: "9px" }}>Terms apply</span>

// good
<span style={{ fontSize: "12px" }}>Terms apply</span>
```

## React Doctor: Bugs

### react-doctor/class-component-missing-component-will-unmount-teardown

Require class components that set up subscriptions or timers in `componentDidMount` to tear them down in `componentWillUnmount`. Severity: `warn`.

```tsx
// bad
componentDidMount() {
  window.addEventListener("resize", this.onResize);
}

// good
componentDidMount() {
  window.addEventListener("resize", this.onResize);
}
componentWillUnmount() {
  window.removeEventListener("resize", this.onResize);
}
```

### react-doctor/debounce-no-cleanup

Require debounced functions created in effects or handlers to be cancelled on cleanup. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  const search = debounce(fetchResults, 300);
  input.addEventListener("input", search);
}, []);

// good
useEffect(() => {
  const search = debounce(fetchResults, 300);
  input.addEventListener("input", search);
  return () => search.cancel();
}, []);
```

### react-doctor/effect-listener-cleanup-mismatch

Require effect cleanup to remove the same event type that was added. Severity: `error`.

```tsx
// bad
useEffect(() => {
  window.addEventListener("scroll", onScroll);
  return () => window.removeEventListener("resize", onScroll);
}, []);

// good
useEffect(() => {
  window.addEventListener("scroll", onScroll);
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```

### react-doctor/effect-listener-cleanup-reference-mismatch

Require `removeEventListener` in cleanup to receive the same function reference passed to `addEventListener`. Severity: `error`.

```tsx
// bad
useEffect(() => {
  window.addEventListener("scroll", () => update());
  return () => window.removeEventListener("scroll", () => update());
}, []);

// good
useEffect(() => {
  const onScroll = () => update();
  window.addEventListener("scroll", onScroll);
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```

### react-doctor/effect-observer-needs-disconnect

Require observers created in effects (IntersectionObserver, ResizeObserver, MutationObserver) to be disconnected in cleanup. Severity: `error`.

```tsx
// bad
useEffect(() => {
  const observer = new ResizeObserver(onResize);
  observer.observe(ref.current);
}, []);

// good
useEffect(() => {
  const observer = new ResizeObserver(onResize);
  observer.observe(ref.current);
  return () => observer.disconnect();
}, []);
```

### react-doctor/effect-raf-loop-needs-cancel

Require `requestAnimationFrame` loops started in effects to be cancelled in cleanup. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  const loop = () => {
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}, []);

// good
useEffect(() => {
  let id: number;
  const loop = () => {
    draw();
    id = requestAnimationFrame(loop);
  };
  id = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(id);
}, []);
```

### react-doctor/effect-remove-listener-inline-handler

Disallow passing an inline function to `removeEventListener`, which never matches the added handler. Severity: `error`.

```tsx
// bad
useEffect(() => {
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", (e) => onKey(e));
}, []);

// good
useEffect(() => {
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}, []);
```

### react-doctor/form-control-requires-name

Require form controls inside a `<form>` to have a `name` attribute so their values submit. Severity: `warn`.

```tsx
// bad
<form>
  <input type="email" />
</form>

// good
<form>
  <input type="email" name="email" />
</form>
```

### react-doctor/hook-import-rename-loses-use-prefix

Disallow renaming an imported hook to a name without the `use` prefix, which breaks the Rules of Hooks lint. Severity: `warn`.

```ts
// bad
import { useAuth as auth } from "./auth";

// good
import { useAuth } from "./auth";
```

### react-doctor/html-label-has-single-control

Require a `<label>` to wrap or reference exactly one form control. Severity: `warn`.

```tsx
// bad
<label>
  Name <input name="first" /> <input name="last" />
</label>

// good
<label>
  First name <input name="first" />
</label>
```

### react-doctor/html-no-nested-form

Disallow nesting a `<form>` inside another `<form>`. Severity: `warn`.

```tsx
// bad
<form onSubmit={save}>
  <form onSubmit={search}><input name="q" /></form>
</form>

// good
<form onSubmit={save}>
  <input name="q" />
</form>
```

### react-doctor/jsx-numeric-and-leaked-render

Disallow `{count && <X />}` conditional rendering with a numeric operand, which renders a literal `0`. Severity: `warn`.

```tsx
// bad
{
  items.length && <List items={items} />;
}

// good
{
  items.length > 0 && <List items={items} />;
}
```

### react-doctor/nextjs-async-dynamic-api-not-awaited

Require awaiting Next.js async dynamic APIs like `cookies()`, `headers()`, and `params`. Severity: `error`.

```ts
// bad
const store = cookies();
const theme = store.get("theme");

// good
const store = await cookies();
const theme = store.get("theme");
```

### react-doctor/nextjs-metadata-url-consistency

Require URLs in Next.js metadata to be consistent with `metadataBase` and each other. Severity: `warn`.

```ts
// bad
export const metadata = {
  metadataBase: new URL("https://example.com"),
  openGraph: { url: "https://other-site.com/page" },
};

// good
export const metadata = {
  metadataBase: new URL("https://example.com"),
  openGraph: { url: "/page" },
};
```

### react-doctor/no-arithmetic-on-optional-chained-operand

Disallow arithmetic on an optional-chained expression, which yields `NaN` when the chain is undefined. Severity: `warn`.

```ts
// bad
const total = cart?.items.length * price;

// good
const total = (cart?.items.length ?? 0) * price;
```

### react-doctor/no-array-find-result-member-access-without-guard

Disallow accessing members on an `Array.prototype.find` result without checking for `undefined`. Severity: `warn`.

```ts
// bad
const name = users.find((u) => u.id === id).name;

// good
const user = users.find((u) => u.id === id);
const name = user ? user.name : "";
```

### react-doctor/no-array-index-deref-without-bounds-or-empty-guard

Disallow dereferencing an array index without a bounds or emptiness check. Severity: `warn`.

```ts
// bad
const first = rows[0].id;

// good
const first = rows.length > 0 ? rows[0].id : null;
```

### react-doctor/no-async-effect-callback

Disallow passing an async function directly to `useEffect`. Severity: `warn`.

```tsx
// bad
useEffect(async () => {
  await loadData();
}, []);

// good
useEffect(() => {
  const run = async () => {
    await loadData();
  };
  void run();
}, []);
```

### react-doctor/no-async-event-handler-without-reentry-guard

Require async event handlers to guard against re-entry while a previous invocation is still pending. Severity: `warn`.

```tsx
// bad
const handleSubmit = async () => {
  await api.save(form);
};

// good
const handleSubmit = async () => {
  if (saving) return;
  setSaving(true);
  try {
    await api.save(form);
  } finally {
    setSaving(false);
  }
};
```

### react-doctor/no-boolean-toggle-without-functional-update

Require boolean state toggles to use the functional updater form. Severity: `warn`.

```tsx
// bad
setOpen(!open);

// good
setOpen((prev) => !prev);
```

### react-doctor/no-broken-image-source

Disallow `img` sources that are empty strings or obviously invalid values. Severity: `warn`.

```tsx
// bad
<img src="" alt="Avatar" />

// good
<img src={avatarUrl || fallbackAvatar} alt="Avatar" />
```

### react-doctor/no-call-component-as-function

Disallow calling a component as a plain function instead of rendering it as JSX. Severity: `warn`.

```tsx
// bad
return <div>{Header({ title })}</div>;

// good
return (
  <div>
    <Header title={title} />
  </div>
);
```

### react-doctor/no-clipped-overlay

Disallow rendering overlays like dropdowns or tooltips inside containers with `overflow: hidden` that clip them. Severity: `warn`.

```tsx
// bad
<div className="overflow-hidden">
  <Tooltip content="Info" />
</div>

// good
<div>
  <Tooltip content="Info" />
</div>
```

### react-doctor/no-collapse-request-error-to-empty-state

Disallow collapsing a failed request into an empty-data state instead of surfacing the error. Severity: `warn`.

```tsx
// bad
fetch("/api/items")
  .then((r) => r.json())
  .catch(() => setItems([]));

// good
fetch("/api/items")
  .then((r) => r.json())
  .then(setItems)
  .catch(() => setError("Failed to load items"));
```

### react-doctor/no-collapsed-literal-or-chain-as-value

Disallow `||` fallbacks that collapse meaningful falsy values like `0` or `""`. Severity: `warn`.

```ts
// bad
const quantity = input.quantity || 1;

// good
const quantity = input.quantity ?? 1;
```

### react-doctor/no-controlled-input-value-without-state-update

Disallow a controlled input `value` without an `onChange` handler that updates state. Severity: `warn`.

```tsx
// bad
<input value={name} />

// good
<input value={name} onChange={(e) => setName(e.target.value)} />
```

### react-doctor/no-create-object-url-in-render

Disallow calling `URL.createObjectURL` during render, which leaks a new blob URL every render. Severity: `warn`.

```tsx
// bad
return <img src={URL.createObjectURL(file)} alt="Preview" />;

// good
const url = useMemo(() => URL.createObjectURL(file), [file]);
useEffect(() => () => URL.revokeObjectURL(url), [url]);
return <img src={url} alt="Preview" />;
```

### react-doctor/no-create-ref-in-function-component

Disallow `createRef` in function components; use `useRef` instead. Severity: `warn`.

```tsx
// bad
const inputRef = createRef<HTMLInputElement>();

// good
const inputRef = useRef<HTMLInputElement>(null);
```

### react-doctor/no-deprecated-keyboard-event-keycode-which

Disallow the deprecated `keyCode` and `which` properties on keyboard events; use `key`. Severity: `warn`.

```tsx
// bad
if (event.keyCode === 13) submit();

// good
if (event.key === "Enter") submit();
```

### react-doctor/no-effect-wrapper-discards-callback-cleanup-return

Disallow effect wrappers that swallow the cleanup function returned by the wrapped callback. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  wrap(() => subscribe());
}, []);

// good
useEffect(() => {
  const unsubscribe = subscribe();
  return unsubscribe;
}, []);
```

### react-doctor/no-enter-submit-without-ime-composition-guard

Require Enter-to-submit key handlers to ignore keydown events fired during IME composition. Severity: `warn`.

```tsx
// bad
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter") submit();
};

// good
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && !e.nativeEvent.isComposing) submit();
};
```

### react-doctor/no-fetch-response-used-without-status-check

Require checking `response.ok` or status before consuming a fetch response body. Severity: `warn`.

```ts
// bad
const res = await fetch("/api/user");
const user = await res.json();

// good
const res = await fetch("/api/user");
if (!res.ok) throw new Error(`Request failed: ${res.status}`);
const user = await res.json();
```

### react-doctor/no-fill-map-element-as-key

Disallow using the element of `Array(n).fill(x).map` as a React key, since every element is identical. Severity: `warn`.

```tsx
// bad
{
  Array(3)
    .fill(0)
    .map((n) => <Skeleton key={n} />);
}

// good
{
  Array.from({ length: 3 }, (_, i) => <Skeleton key={i} />);
}
```

### react-doctor/no-fixed-inside-transformed-ancestor

Disallow `position: fixed` elements inside a transformed ancestor, where fixed positioning silently breaks. Severity: `warn`.

```tsx
// bad
<div style={{ transform: "translateX(10px)" }}>
  <div style={{ position: "fixed", top: 0 }}>Banner</div>
</div>

// good
<div style={{ transform: "translateX(10px)" }}>Content</div>
<div style={{ position: "fixed", top: 0 }}>Banner</div>
```

### react-doctor/no-floating-then-in-jsx-handler

Disallow floating `.then()` chains in JSX event handlers without error handling. Severity: `warn`.

```tsx
// bad
<button onClick={() => save().then(refresh)}>Save</button>

// good
<button onClick={() => save().then(refresh).catch(showError)}>Save</button>
```

### react-doctor/no-hydration-branch-on-browser-global

Disallow branching render output on browser globals like `window`, which causes hydration mismatches. Severity: `error`.

```tsx
// bad
return typeof window !== "undefined" ? <Widget /> : null;

// good
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
return mounted ? <Widget /> : null;
```

### react-doctor/no-impure-call-at-module-scope

Disallow impure calls with side effects at module scope. Severity: `warn`.

```ts
// bad
const sessionId = crypto.randomUUID();

// good
const getSessionId = () => crypto.randomUUID();
```

### react-doctor/no-impure-state-updater

Disallow impure calls like `Date.now()` or `Math.random()` inside state updater functions. Severity: `error`.

```tsx
// bad
setItems((prev) => [...prev, { id: Math.random() }]);

// good
const id = crypto.randomUUID();
setItems((prev) => [...prev, { id }]);
```

### react-doctor/no-indeterminate-attribute

Disallow setting `indeterminate` as a JSX attribute; it is a DOM property and must be set via a ref. Severity: `warn`.

```tsx
// bad
<input type="checkbox" indeterminate />

// good
<input type="checkbox" ref={(el) => { if (el) el.indeterminate = true; }} />
```

### react-doctor/no-inert-sticky-position

Disallow `position: sticky` on elements where it cannot work, such as inside `overflow: hidden` containers or without an offset. Severity: `warn`.

```tsx
// bad
<div className="overflow-hidden">
  <header style={{ position: "sticky" }}>Title</header>
</div>

// good
<div>
  <header style={{ position: "sticky", top: 0 }}>Title</header>
</div>
```

### react-doctor/no-loading-flag-reset-outside-finally

Require loading flags set before an async call to be reset in a `finally` block. Severity: `warn`.

```ts
// bad
setLoading(true);
await api.save(form);
setLoading(false);

// good
setLoading(true);
try {
  await api.save(form);
} finally {
  setLoading(false);
}
```

### react-doctor/no-locale-format-in-render

Disallow locale-sensitive formatting calls in render without memoization or a stable formatter. Severity: `warn`.

```tsx
// bad
return <span>{new Intl.NumberFormat("en-US").format(price)}</span>;

// good
const formatter = useMemo(() => new Intl.NumberFormat("en-US"), []);
return <span>{formatter.format(price)}</span>;
```

### react-doctor/no-match-media-in-state-initializer

Disallow calling `window.matchMedia` in a `useState` initializer, which breaks SSR and never updates. Severity: `warn`.

```tsx
// bad
const [isDark] = useState(window.matchMedia("(prefers-color-scheme: dark)").matches);

// good
const [isDark, setIsDark] = useState(false);
useEffect(() => {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  setIsDark(mq.matches);
}, []);
```

### react-doctor/no-mixed-srcset-descriptors

Disallow mixing width (`w`) and density (`x`) descriptors in a single `srcset`. Severity: `warn`.

```tsx
// bad
<img srcSet="a.jpg 1x, b.jpg 800w" alt="" />

// good
<img srcSet="a.jpg 400w, b.jpg 800w" sizes="100vw" alt="" />
```

### react-doctor/no-mutate-queried-dom-node-in-component

Disallow mutating DOM nodes obtained via document queries inside a component instead of using refs and state. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  document.querySelector(".title")!.textContent = title;
}, [title]);

// good
return <h1 className="title">{title}</h1>;
```

### react-doctor/no-mutate-then-set-or-return-same-reference

Disallow mutating an object or array and then setting or returning the same reference, which skips re-renders. Severity: `warn`.

```tsx
// bad
items.push(newItem);
setItems(items);

// good
setItems([...items, newItem]);
```

### react-doctor/no-mutating-array-method-on-prop-or-hook-result

Disallow mutating array methods like `sort` or `reverse` on props or hook results. Severity: `warn`.

```tsx
// bad
const sorted = props.items.sort(byName);

// good
const sorted = [...props.items].sort(byName);
```

### react-doctor/no-non-literal-selector-query-without-try-catch

Require wrapping `querySelector` calls with non-literal selectors in try/catch, since invalid selectors throw. Severity: `warn`.

```ts
// bad
const el = document.querySelector(userSelector);

// good
let el: Element | null = null;
try {
  el = document.querySelector(userSelector);
} catch {
  el = null;
}
```

### react-doctor/no-non-null-assertion-on-maybe-undefined-result

Disallow non-null assertions on results that can legitimately be undefined, such as `find` or map lookups. Severity: `warn`.

```ts
// bad
const user = users.find((u) => u.id === id)!;

// good
const user = users.find((u) => u.id === id);
if (!user) throw new Error(`User ${id} not found`);
```

### react-doctor/no-nondeterministic-id-value-in-render-body

Disallow generating ids with `Math.random()` or `Date.now()` in the render body; use `useId` or a stable id. Severity: `warn`.

```tsx
// bad
const id = `field-${Math.random()}`;
return <input id={id} />;

// good
const id = useId();
return <input id={id} />;
```

### react-doctor/no-nullish-coalescing-arithmetic-precedence

Disallow mixing `??` with arithmetic operators without parentheses. Severity: `warn`.

```ts
// bad
const total = base ?? 0 + tax;

// good
const total = (base ?? 0) + tax;
```

### react-doctor/no-object-keys-values-entries-on-maybe-undefined

Disallow calling `Object.keys`, `Object.values`, or `Object.entries` on a value that may be undefined. Severity: `warn`.

```ts
// bad
const keys = Object.keys(config?.options);

// good
const keys = Object.keys(config?.options ?? {});
```

### react-doctor/no-object-or-array-coerced-to-string-in-template-literal

Disallow interpolating objects or arrays into template literals, which coerces to `[object Object]`. Severity: `warn`.

```ts
// bad
const message = `Payload: ${payload}`;

// good
const message = `Payload: ${JSON.stringify(payload)}`;
```

### react-doctor/no-passive-request-owner-ref

Require async requests in components to track an owner or abort ref so stale responses are ignored. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  fetchUser(id).then(setUser);
}, [id]);

// good
useEffect(() => {
  let active = true;
  fetchUser(id).then((u) => {
    if (active) setUser(u);
  });
  return () => {
    active = false;
  };
}, [id]);
```

### react-doctor/no-predicate-function-reference-in-boolean-position

Disallow using a predicate function reference in a boolean position instead of calling it. Severity: `warn`.

```tsx
// bad
{
  isAdmin && <AdminPanel />;
}

// good
{
  isAdmin() && <AdminPanel />;
}
```

### react-doctor/no-promise-then-side-effect-in-effect-without-catch

Require `.then()` chains with side effects inside effects to have a `.catch()`. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  loadItems().then(setItems);
}, []);

// good
useEffect(() => {
  loadItems()
    .then(setItems)
    .catch(() => setError("Failed to load"));
}, []);
```

### react-doctor/no-prop-callback-in-render

Disallow calling a callback prop during render instead of from an event or effect. Severity: `error`.

```tsx
// bad
const Item = ({ onSelect }: Props) => {
  onSelect();
  return <li>Item</li>;
};

// good
const Item = ({ onSelect }: Props) => {
  return <li onClick={onSelect}>Item</li>;
};
```

### react-doctor/no-ref-current-in-render

Disallow reading or writing `ref.current` during render. Severity: `error`.

```tsx
// bad
return <div>{widthRef.current}</div>;

// good
useEffect(() => {
  setWidth(widthRef.current);
}, []);
return <div>{width}</div>;
```

### react-doctor/no-set-state-after-await-in-effect

Disallow calling setState after an `await` in an effect without checking the effect is still mounted. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  (async () => {
    const data = await load();
    setData(data);
  })();
}, []);

// good
useEffect(() => {
  let active = true;
  (async () => {
    const data = await load();
    if (active) setData(data);
  })();
  return () => {
    active = false;
  };
}, []);
```

### react-doctor/no-side-effect-in-state-updater-function

Disallow side effects like setState calls or mutations inside a state updater function. Severity: `warn`.

```tsx
// bad
setCount((prev) => {
  logEvent("increment");
  return prev + 1;
});

// good
logEvent("increment");
setCount((prev) => prev + 1);
```

### react-doctor/no-spread-props-over-defaults-clobbers-with-undefined

Disallow spreading props after defaults when the spread can overwrite defaults with `undefined`. Severity: `warn`.

```tsx
// bad
const config = { size: "md", ...props };

// good
const config = { size: props.size ?? "md" };
```

### react-doctor/no-stale-timer-ref

Disallow timer refs that are overwritten without clearing the previous timer, leaking stale timers. Severity: `warn`.

```tsx
// bad
timerRef.current = setTimeout(fire, 1000);

// good
if (timerRef.current) clearTimeout(timerRef.current);
timerRef.current = setTimeout(fire, 1000);
```

### react-doctor/no-string-false-on-boolean-attribute

Disallow passing the string `"false"` to a boolean attribute, where it is truthy. Severity: `warn`.

```tsx
// bad
<input disabled="false" />

// good
<input disabled={false} />
```

### react-doctor/no-unescaped-dynamic-string-in-regexp

Disallow building a RegExp from a dynamic string without escaping special characters. Severity: `warn`.

```ts
// bad
const re = new RegExp(userInput);

// good
const re = new RegExp(escapeRegExp(userInput));
```

### react-doctor/no-unguarded-browser-global-at-module-scope

Disallow accessing browser globals like `window` at module scope without an environment guard. Severity: `warn`.

```ts
// bad
const width = window.innerWidth;

// good
const width = typeof window !== "undefined" ? window.innerWidth : 0;
```

### react-doctor/no-unguarded-browser-global-in-render-or-hook-init

Disallow accessing browser globals during render or hook initialization without a guard. Severity: `warn`.

```tsx
// bad
const [width, setWidth] = useState(window.innerWidth);

// good
const [width, setWidth] = useState(0);
useEffect(() => setWidth(window.innerWidth), []);
```

### react-doctor/no-unguarded-numeric-input-parse

Require guarding parsed numeric input against `NaN` before use. Severity: `warn`.

```ts
// bad
const age = parseInt(input.value, 10);
setAge(age);

// good
const age = parseInt(input.value, 10);
if (!Number.isNaN(age)) setAge(age);
```

### react-doctor/no-unguarded-throwing-parse-call

Require wrapping throwing parse calls like `new URL()` or `decodeURIComponent` in try/catch. Severity: `warn`.

```ts
// bad
const url = new URL(input);

// good
let url: URL | null = null;
try {
  url = new URL(input);
} catch {
  url = null;
}
```

### react-doctor/no-unowned-async-error-clear

Disallow clearing a shared error state from an async callback that may no longer own it. Severity: `warn`.

```tsx
// bad
const handleRetry = async () => {
  await refetch();
  setError(null);
};

// good
const handleRetry = async () => {
  const requestId = ++requestIdRef.current;
  await refetch();
  if (requestId === requestIdRef.current) setError(null);
};
```

### react-doctor/no-unsafe-json-parse

Require wrapping `JSON.parse` of untrusted input in try/catch or a safe parser. Severity: `warn`.

```ts
// bad
const settings = JSON.parse(localStorage.getItem("settings")!);

// good
let settings = defaultSettings;
try {
  settings = JSON.parse(localStorage.getItem("settings") ?? "{}");
} catch {}
```

### react-doctor/no-whole-object-default-losing-per-key-defaults

Disallow defaulting a whole object with `??` or `||` in a way that drops per-key defaults when a partial object is provided. Severity: `warn`.

```ts
// bad
const config = userConfig ?? { retries: 3, timeout: 5000 };

// good
const config = { retries: 3, timeout: 5000, ...userConfig };
```

### react-doctor/no-whole-object-dep-with-member-reads

Disallow depending on a whole object in a deps array when the effect only reads specific members. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  track(user.id);
}, [user]);

// good
useEffect(() => {
  track(user.id);
}, [user.id]);
```

### react-doctor/pointer-capture-needs-cancel-handler

Require components using `setPointerCapture` to handle `pointercancel` or `lostpointercapture`. Severity: `warn`.

```tsx
// bad
<div onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
     onPointerUp={endDrag} />

// good
<div onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
     onPointerUp={endDrag}
     onPointerCancel={endDrag} />
```

### react-doctor/shadcn-tabs-trigger-requires-list

Require shadcn `TabsTrigger` components to be wrapped in a `TabsList`. Severity: `warn`.

```tsx
// bad
<Tabs>
  <TabsTrigger value="a">A</TabsTrigger>
</Tabs>

// good
<Tabs>
  <TabsList>
    <TabsTrigger value="a">A</TabsTrigger>
  </TabsList>
</Tabs>
```

### react-doctor/waapi-animation-in-render

Disallow starting Web Animations API animations during render; start them in an effect. Severity: `error`.

```tsx
// bad
ref.current?.animate(keyframes, options);
return <div ref={ref} />;

// good
useEffect(() => {
  const animation = ref.current?.animate(keyframes, options);
  return () => animation?.cancel();
}, []);
```

### react-doctor/web-animation-offsets-valid

Require Web Animations keyframe offsets to be between 0 and 1 and monotonically increasing. Severity: `error`.

```ts
// bad
el.animate(
  [
    { opacity: 0, offset: 0.8 },
    { opacity: 1, offset: 0.2 },
  ],
  300,
);

// good
el.animate(
  [
    { opacity: 0, offset: 0 },
    { opacity: 1, offset: 1 },
  ],
  300,
);
```

## React Doctor: Bundle Size

### react-doctor/no-barrel-import

Disallow importing from barrel files when a direct module path is available. Severity: `warn`.

```ts
// bad
import { Button } from "@/components";

// good
import { Button } from "@/components/button";
```

### react-doctor/no-dynamic-import-path

Disallow fully dynamic import paths that prevent bundler code splitting. Severity: `warn`.

```ts
// bad
const mod = await import(modulePath);

// good
const mod = await import(`./widgets/${name}.tsx`);
```

### react-doctor/no-full-lodash-import

Disallow importing all of lodash; import individual functions instead. Severity: `warn`.

```ts
// bad
import _ from "lodash";
const sorted = _.sortBy(items, "name");

// good
import sortBy from "lodash/sortBy";
const sorted = sortBy(items, "name");
```

### react-doctor/no-moment

Disallow the moment library; use a lighter alternative like date-fns or the Temporal/Intl APIs. Severity: `warn`.

```ts
// bad
import moment from "moment";
const label = moment(date).format("YYYY-MM-DD");

// good
import { format } from "date-fns";
const label = format(date, "yyyy-MM-dd");
```

### react-doctor/no-undeferred-third-party

Disallow loading third-party scripts eagerly instead of deferring them. Severity: `warn`.

```tsx
// bad
<script src="https://widget.example.com/embed.js" />

// good
<Script src="https://widget.example.com/embed.js" strategy="lazyOnload" />
```

### react-doctor/prefer-dynamic-import

Require dynamic imports for heavy components that are not needed on initial render. Severity: `warn`.

```tsx
// bad
import ChartPanel from "./chart-panel";

// good
const ChartPanel = lazy(() => import("./chart-panel"));
```

### react-doctor/use-lazy-motion

Require `LazyMotion` with `domAnimation` from framer-motion instead of the full `motion` import. Severity: `warn`.

```tsx
// bad
import { motion } from "framer-motion";
<motion.div animate={{ opacity: 1 }} />;

// good
import { LazyMotion, domAnimation, m } from "framer-motion";
<LazyMotion features={domAnimation}>
  <m.div animate={{ opacity: 1 }} />
</LazyMotion>;
```

## React Doctor: Client APIs

### react-doctor/client-localstorage-no-version

Require localStorage payloads to include a schema version key so stale data can be migrated or discarded. Severity: `warn`.

```ts
// bad
localStorage.setItem("settings", JSON.stringify({ theme }));

// good
localStorage.setItem("settings", JSON.stringify({ version: 1, theme }));
```

### react-doctor/client-passive-event-listeners

Require passive listeners for scroll-blocking events like `touchstart` and `wheel`. Severity: `warn`.

```ts
// bad
window.addEventListener("touchstart", onTouch);

// good
window.addEventListener("touchstart", onTouch, { passive: true });
```

## React Doctor: JavaScript Performance

### react-doctor/async-await-in-loop

Disallow awaiting inside a loop when the iterations are independent. Severity: `warn`.

```ts
// bad
for (const id of ids) {
  const user = await fetchUser(id);
  users.push(user);
}

// good
const users = await Promise.allSettled(ids.map((id) => fetchUser(id)));
```

### react-doctor/async-parallel

Prefer running independent async operations in parallel instead of sequentially awaiting each one. Severity: `warn`.

```ts
// bad
const user = await fetchUser();
const posts = await fetchPosts();

// good
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);
```

### react-doctor/js-async-reduce-without-awaited-acc

Disallow async reducers that await the accumulator on every iteration, serializing the work. Severity: `warn`.

```ts
// bad
const total = await items.reduce(async (accPromise, item) => {
  const acc = await accPromise;
  return acc + (await fetchPrice(item));
}, Promise.resolve(0));

// good
const prices = await Promise.all(items.map((item) => fetchPrice(item)));
const total = prices.reduce((acc, price) => acc + price, 0);
```

### react-doctor/js-batch-dom-css

Prefer batching DOM style changes via a class or cssText instead of setting style properties one at a time. Severity: `warn`.

```ts
// bad
el.style.width = "100px";
el.style.height = "50px";
el.style.opacity = "0.5";

// good
el.classList.add("card-collapsed");
```

### react-doctor/js-cache-property-access

Prefer caching a repeatedly accessed property chain in a local variable inside loops. Severity: `warn`.

```ts
// bad
for (let i = 0; i < arr.length; i++) {
  process(config.settings.theme, arr[i]);
}

// good
const theme = config.settings.theme;
for (let i = 0; i < arr.length; i++) {
  process(theme, arr[i]);
}
```

### react-doctor/js-cache-storage

Prefer caching localStorage/sessionStorage reads instead of re-reading the same key repeatedly. Severity: `warn`.

```ts
// bad
for (const item of items) {
  render(item, localStorage.getItem("theme"));
}

// good
const theme = localStorage.getItem("theme");
for (const item of items) {
  render(item, theme);
}
```

### react-doctor/js-combine-iterations

Prefer combining chained array iterations into a single pass. Severity: `warn`.

```ts
// bad
const names = users.filter((u) => u.active).map((u) => u.name);

// good
const names = [];
for (const u of users) {
  if (u.active) names.push(u.name);
}
```

### react-doctor/js-early-exit

Prefer early-exit methods like some/find/includes over full iterations that only need the first match. Severity: `warn`.

```ts
// bad
const hasAdmin = users.filter((u) => u.role === "admin").length > 0;

// good
const hasAdmin = users.some((u) => u.role === "admin");
```

### react-doctor/js-flatmap-filter

Prefer flatMap over chaining map and flat, or filter-then-map pairs that flatMap can express in one pass. Severity: `warn`.

```ts
// bad
const tags = posts.map((p) => p.tags).flat();

// good
const tags = posts.flatMap((p) => p.tags);
```

### react-doctor/js-hoist-intl

Prefer hoisting Intl formatter construction out of loops and render paths. Severity: `warn`.

```ts
// bad
const labels = dates.map((d) => new Intl.DateTimeFormat("en-US").format(d));

// good
const formatter = new Intl.DateTimeFormat("en-US");
const labels = dates.map((d) => formatter.format(d));
```

### react-doctor/js-hoist-regexp

Prefer hoisting regular expression literals out of loops and frequently called functions. Severity: `warn`.

```ts
// bad
const valid = emails.filter((e) => /^[^@]+@[^@]+$/.test(e));

// good
const EMAIL_RE = /^[^@]+@[^@]+$/;
const valid = emails.filter((e) => EMAIL_RE.test(e));
```

### react-doctor/js-index-maps

Prefer building a Map index instead of repeated array.find lookups in a loop. Severity: `warn`.

```ts
// bad
const rows = orders.map((o) => users.find((u) => u.id === o.userId));

// good
const usersById = new Map(users.map((u) => [u.id, u]));
const rows = orders.map((o) => usersById.get(o.userId));
```

### react-doctor/js-length-check-first

Prefer checking cheap length conditions before running expensive comparisons. Severity: `warn`.

```ts
// bad
if (a.join(",") === b.join(",")) sync(a, b);

// good
if (a.length === b.length && a.join(",") === b.join(",")) sync(a, b);
```

### react-doctor/js-min-max-loop

Prefer a single loop to find min/max instead of spreading large arrays into Math.min/Math.max or sorting. Severity: `warn`.

```ts
// bad
const max = Math.max(...values);

// good
let max = -Infinity;
for (const v of values) {
  if (v > max) max = v;
}
```

### react-doctor/js-set-map-lookups

Prefer Set/Map lookups over repeated array includes/indexOf membership checks. Severity: `warn`.

```ts
// bad
const active = users.filter((u) => activeIds.includes(u.id));

// good
const activeIdSet = new Set(activeIds);
const active = users.filter((u) => activeIdSet.has(u.id));
```

### react-doctor/js-tosorted-immutable

Prefer toSorted()/toReversed() over copying an array just to mutate it with sort()/reverse(). Severity: `warn`.

```ts
// bad
const sorted = [...items].sort((a, b) => a.rank - b.rank);

// good
const sorted = items.toSorted((a, b) => a.rank - b.rank);
```

## React Doctor: Maintainability

### react-doctor/no-auto-scrolling-content

Disallow content that scrolls automatically without user interaction. Severity: `warn`.

```tsx
// bad
<marquee>Breaking news updates</marquee>

// good
<div className="overflow-x-auto">Breaking news updates</div>
```

### react-doctor/no-deprecated-tailwind-class

Disallow Tailwind classes that were deprecated or renamed in newer versions. Severity: `warn`.

```tsx
// bad
<div className="flex-shrink-0 flex-grow" />

// good
<div className="shrink-0 grow" />
```

### react-doctor/no-dynamic-tailwind-class-fragment

Disallow building Tailwind class names from dynamic string fragments that the compiler cannot detect. Severity: `warn`.

```tsx
// bad
<div className={`text-${color}-500`} />

// good
<div className={color === "red" ? "text-red-500" : "text-blue-500"} />
```

### react-doctor/no-excessive-font-families

Disallow using more distinct font families than a coherent design needs. Severity: `warn`.

```tsx
// bad
<p className="font-serif">
  <span className="font-mono">a</span>
  <span className="font-display">b</span>
  <span className="font-body">c</span>
</p>

// good
<p className="font-sans">
  <code className="font-mono">a</code>
</p>
```

### react-doctor/no-inline-hoc-on-component

Disallow wrapping a component with a higher-order component inline in the module or render body. Severity: `warn`.

```tsx
// bad
const Page = () => <Chart data={memo(ChartInner)} />;

// good
const MemoChartInner = memo(ChartInner);
const Page = () => <Chart data={MemoChartInner} />;
```

### react-doctor/no-layout-shifting-interaction-state

Disallow hover/focus/active styles that change element size and shift surrounding layout. Severity: `warn`.

```tsx
// bad
<button className="border-0 hover:border-2">Save</button>

// good
<button className="border-2 border-transparent hover:border-blue-500">Save</button>
```

### react-doctor/no-mixed-icon-libraries

Disallow mixing icons from multiple icon libraries in the same codebase. Severity: `warn`.

```tsx
// bad
import { Check } from "lucide-react";
import { FaTimes } from "react-icons/fa";

// good
import { Check, X } from "lucide-react";
```

### react-doctor/no-redundant-display-class

Disallow display utility classes that restate the element's default or an already-applied display. Severity: `warn`.

```tsx
// bad
<div className="block flex-col flex">Content</div>

// good
<div className="flex flex-col">Content</div>
```

### react-doctor/no-redundant-title-tooltip

Disallow a title attribute that duplicates the element's visible text. Severity: `warn`.

```tsx
// bad
<button title="Save changes">Save changes</button>

// good
<button>Save changes</button>
```

### react-doctor/no-svg-currentcolor-with-fill-class

Disallow pairing an SVG that uses currentColor with a fill-\* utility class that does not affect it. Severity: `warn`.

```tsx
// bad
<svg className="fill-red-500">
  <path fill="currentColor" d="..." />
</svg>

// good
<svg className="text-red-500">
  <path fill="currentColor" d="..." />
</svg>
```

### react-doctor/prefer-tabular-numeric-data

Prefer tabular numbers for columns of numeric data so digits align. Severity: `warn`.

```tsx
// bad
<td>{price.toFixed(2)}</td>

// good
<td className="tabular-nums">{price.toFixed(2)}</td>
```

### react-doctor/prefer-truncate-shorthand

Prefer the truncate shorthand over spelling out overflow-hidden, text-ellipsis, and whitespace-nowrap. Severity: `warn`.

```tsx
// bad
<p className="overflow-hidden text-ellipsis whitespace-nowrap">{title}</p>

// good
<p className="truncate">{title}</p>
```

### react-doctor/require-autoplay-video-poster

Require a poster on autoplaying videos so a frame shows before playback starts. Severity: `warn`.

```tsx
// bad
<video autoPlay muted loop src="/hero.mp4" />

// good
<video autoPlay muted loop src="/hero.mp4" poster="/hero-frame.jpg" />
```

## React Doctor: Runtime Performance

### react-doctor/context-provider-value-from-unmemoized-local-literal

Disallow passing a freshly created object literal as a context provider value without memoization. Severity: `warn`.

```tsx
// bad
<ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;

// good
const value = useMemo(() => ({ theme, setTheme }), [theme]);
return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
```

### react-doctor/no-create-object-url-without-revoke

Disallow calling URL.createObjectURL without a matching URL.revokeObjectURL. Severity: `warn`.

```tsx
// bad
const url = URL.createObjectURL(file);
setPreview(url);

// good
const url = URL.createObjectURL(file);
setPreview(url);
return () => URL.revokeObjectURL(url);
```

### react-doctor/no-document-write

Disallow document.write, which blocks parsing and can wipe the document. Severity: `warn`.

```ts
// bad
document.write("<script src='/analytics.js'></script>");

// good
const script = document.createElement("script");
script.src = "/analytics.js";
document.head.append(script);
```

### react-doctor/no-eager-new-in-use-state-initializer

Disallow constructing objects eagerly in useState calls; pass a lazy initializer instead. Severity: `warn`.

```tsx
// bad
const [store, setStore] = useState(new DataStore(props.rows));

// good
const [store, setStore] = useState(() => new DataStore(props.rows));
```

### react-doctor/no-ease-in-motion

Disallow ease-in timing on entrance animations; prefer ease-out so motion starts fast and settles. Severity: `warn`.

```tsx
// bad
<div className="transition-opacity ease-in duration-200" />

// good
<div className="transition-opacity ease-out duration-200" />
```

### react-doctor/no-img-lazy-with-high-fetchpriority

Disallow combining loading="lazy" with fetchPriority="high" on the same image. Severity: `warn`.

```tsx
// bad
<img src="/hero.jpg" loading="lazy" fetchPriority="high" />

// good
<img src="/hero.jpg" fetchPriority="high" />
```

### react-doctor/no-img-without-dimensions

Disallow images without explicit width and height, which causes layout shift. Severity: `warn`.

```tsx
// bad
<img src="/banner.jpg" alt="Banner" />

// good
<img src="/banner.jpg" alt="Banner" width={1200} height={400} />
```

### react-doctor/no-json-parse-stringify-clone

Disallow cloning objects via JSON.parse(JSON.stringify()); use structuredClone instead. Severity: `warn`.

```ts
// bad
const copy = JSON.parse(JSON.stringify(state));

// good
const copy = structuredClone(state);
```

### react-doctor/no-spread-accumulator-in-reduce

Disallow spreading the accumulator on every reduce iteration, which makes the reduction quadratic. Severity: `warn`.

```ts
// bad
const byId = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});

// good
const byId = users.reduce((acc, u) => {
  acc[u.id] = u;
  return acc;
}, {});
```

### react-doctor/no-srcset-without-sizes

Disallow width-based srcSet on images without a sizes attribute. Severity: `warn`.

```tsx
// bad
<img srcSet="/img-480.jpg 480w, /img-960.jpg 960w" src="/img-960.jpg" />

// good
<img srcSet="/img-480.jpg 480w, /img-960.jpg 960w" sizes="(max-width: 600px) 480px, 960px" src="/img-960.jpg" />
```

### react-doctor/no-sync-xhr

Disallow synchronous XMLHttpRequest, which blocks the main thread. Severity: `warn`.

```ts
// bad
const xhr = new XMLHttpRequest();
xhr.open("GET", "/api/data", false);
xhr.send();

// good
const res = await fetch("/api/data");
```

### react-doctor/no-tailwind-layout-transition

Disallow Tailwind transitions on layout properties like width, height, or margin. Severity: `warn`.

```tsx
// bad
<div className="transition-[width] hover:w-64" />

// good
<div className="transition-transform hover:scale-x-110" />
```

### react-doctor/no-unbounded-animation-frame-loop

Disallow requestAnimationFrame loops that never stop or cancel. Severity: `warn`.

```ts
// bad
const tick = () => {
  update();
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);

// good
let id = requestAnimationFrame(function tick() {
  update();
  if (running) id = requestAnimationFrame(tick);
});
return () => cancelAnimationFrame(id);
```

### react-doctor/no-unthrottled-scroll-mutation

Disallow mutating the DOM directly in scroll handlers without throttling via requestAnimationFrame. Severity: `warn`.

```ts
// bad
window.addEventListener("scroll", () => {
  header.style.opacity = String(1 - window.scrollY / 300);
});

// good
window.addEventListener("scroll", () => {
  requestAnimationFrame(() => {
    header.style.opacity = String(1 - window.scrollY / 300);
  });
});
```

### react-doctor/prefer-motion-transform-property

Prefer animating dedicated transform properties over layout-affecting positional properties. Severity: `warn`.

```tsx
// bad
<motion.div animate={{ left: 100, top: 50 }} />

// good
<motion.div animate={{ x: 100, y: 50 }} />
```

## React Doctor: React Performance

### react-doctor/async-defer-await

Prefer deferring an await below unrelated synchronous work so it does not block. Severity: `warn`.

```ts
// bad
const data = await fetchData();
const config = buildConfig();
render(config, data);

// good
const dataPromise = fetchData();
const config = buildConfig();
render(config, await dataPromise);
```

### react-doctor/no-global-css-variable-animation

Disallow animating CSS variables on :root, which forces the whole page to restyle every frame. Severity: `error`.

```tsx
// bad
document.documentElement.style.setProperty("--x", `${mouseX}px`);

// good
cursorEl.style.transform = `translateX(${mouseX}px)`;
```

### react-doctor/no-inline-prop-on-memo-component

Disallow inline object, array, or function props on memoized components, which defeat the memo. Severity: `warn`.

```tsx
// bad
<MemoList items={items} onSelect={(id) => select(id)} />;

// good
const handleSelect = useCallback((id) => select(id), []);
<MemoList items={items} onSelect={handleSelect} />;
```

### react-doctor/no-large-animated-blur

Disallow animating large blur effects, which are expensive to composite. Severity: `warn`.

```tsx
// bad
<div className="transition-all hover:blur-3xl" />

// good
<div className="transition-opacity hover:opacity-50" />
```

### react-doctor/no-layout-property-animation

Disallow animating layout properties like width, height, top, or left; animate transform instead. Severity: `error`.

```tsx
// bad
<div style={{ transition: "width 200ms" }} />

// good
<div style={{ transition: "transform 200ms" }} />
```

### react-doctor/no-permanent-will-change

Disallow leaving will-change applied permanently instead of only around the animation. Severity: `warn`.

```tsx
// bad
<div className="will-change-transform">{content}</div>

// good
<div className={isAnimating ? "will-change-transform" : ""}>{content}</div>
```

### react-doctor/no-scale-from-zero

Disallow entrance animations that scale from zero; start from a value near one instead. Severity: `warn`.

```tsx
// bad
<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} />

// good
<motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} />
```

### react-doctor/no-transition-all

Disallow transition-all; list the specific properties to transition. Severity: `warn`.

```tsx
// bad
<button className="transition-all hover:bg-blue-600" />

// good
<button className="transition-colors hover:bg-blue-600" />
```

### react-doctor/no-usememo-simple-expression

Disallow useMemo around trivial expressions that are cheaper than the memoization itself. Severity: `warn`.

```tsx
// bad
const doubled = useMemo(() => count * 2, [count]);

// good
const doubled = count * 2;
```

### react-doctor/prefer-stable-empty-fallback

Prefer a hoisted constant fallback over a fresh empty literal created on every render. Severity: `warn`.

```tsx
// bad
const List = ({ items }) => <Rows items={items ?? []} />;

// good
const EMPTY_ITEMS = [];
const List = ({ items }) => <Rows items={items ?? EMPTY_ITEMS} />;
```

### react-doctor/rendering-animate-svg-wrapper

Prefer animating a wrapper element around an SVG instead of the SVG's internals. Severity: `warn`.

```tsx
// bad
<svg className="animate-spin"><path d="..." /></svg>

// good
<div className="animate-spin"><svg><path d="..." /></svg></div>
```

### react-doctor/rendering-hoist-jsx

Prefer hoisting static JSX out of the component body so it is not recreated each render. Severity: `warn`.

```tsx
// bad
const Page = () => {
  const footer = <Footer year={2026} />;
  return <div>{footer}</div>;
};

// good
const footer = <Footer year={2026} />;
const Page = () => <div>{footer}</div>;
```

### react-doctor/rendering-hydration-mismatch-time

Disallow rendering current-time values like Date.now() during render, which mismatch between server and client. Severity: `warn`.

```tsx
// bad
const Clock = () => <span>{new Date().toLocaleTimeString()}</span>;

// good
const Clock = () => {
  const [time, setTime] = useState("");
  useEffect(() => setTime(new Date().toLocaleTimeString()), []);
  return <span>{time}</span>;
};
```

### react-doctor/rendering-hydration-no-flicker

Disallow client-only state reads that flicker after hydration; resolve them before first paint. Severity: `warn`.

```tsx
// bad
const [theme, setTheme] = useState("light");
useEffect(() => setTheme(localStorage.getItem("theme") ?? "light"), []);

// good
<script
  dangerouslySetInnerHTML={{
    __html: "document.documentElement.dataset.theme = localStorage.getItem('theme') ?? 'light'",
  }}
/>;
```

### react-doctor/rendering-script-defer-async

Prefer defer or async on script tags so they do not block parsing. Severity: `warn`.

```tsx
// bad
<script src="/analytics.js" />

// good
<script src="/analytics.js" defer />
```

### react-doctor/rendering-usetransition-loading

Prefer useTransition for pending state instead of manual loading flags around state updates. Severity: `warn`.

```tsx
// bad
setLoading(true);
setFilter(next);
setLoading(false);

// good
const [isPending, startTransition] = useTransition();
startTransition(() => setFilter(next));
```

### react-doctor/rerender-derived-state-from-hook

Prefer deriving values during render instead of mirroring hook results into state with an effect. Severity: `warn`.

```tsx
// bad
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(`${first} ${last}`), [first, last]);

// good
const fullName = `${first} ${last}`;
```

### react-doctor/rerender-memo-before-early-return

Disallow calling useMemo/useCallback after a conditional early return. Severity: `warn`.

```tsx
// bad
if (!data) return null;
const rows = useMemo(() => sort(data), [data]);

// good
const rows = useMemo(() => sort(data ?? []), [data]);
if (!data) return null;
```

### react-doctor/rerender-memo-with-default-value

Disallow default parameter values that create a fresh object each render on memoized components. Severity: `warn`.

```tsx
// bad
const List = memo(({ items = [] }) => <Rows items={items} />);

// good
const EMPTY_ITEMS = [];
const List = memo(({ items = EMPTY_ITEMS }) => <Rows items={items} />);
```

### react-doctor/rerender-transitions-scroll

Prefer marking scroll-driven state updates as transitions so they do not block urgent renders. Severity: `warn`.

```tsx
// bad
const handleScroll = () => setScrollY(window.scrollY);

// good
const handleScroll = () => startTransition(() => setScrollY(window.scrollY));
```

## React Doctor: Next.js App Router

### react-doctor/nextjs-error-boundary-missing-use-client

Require the "use client" directive in error.tsx files. Severity: `error`.

```tsx
// bad
export default function Error({ reset }) {
  return <button onClick={reset}>Retry</button>;
}

// good
("use client");
export default function Error({ reset }) {
  return <button onClick={reset}>Retry</button>;
}
```

### react-doctor/nextjs-global-error-missing-html-body

Require global-error.tsx to render its own html and body tags. Severity: `error`.

```tsx
// bad
export default function GlobalError() {
  return <h1>Something went wrong</h1>;
}

// good
export default function GlobalError() {
  return (
    <html>
      <body>
        <h1>Something went wrong</h1>
      </body>
    </html>
  );
}
```

### react-doctor/nextjs-image-missing-sizes

Require a sizes prop on next/image when using fill. Severity: `warn`.

```tsx
// bad
<Image src="/hero.jpg" alt="Hero" fill />

// good
<Image src="/hero.jpg" alt="Hero" fill sizes="100vw" />
```

### react-doctor/nextjs-missing-metadata

Require pages and layouts to export metadata or generateMetadata. Severity: `warn`.

```tsx
// bad
export default function Page() {
  return <main>Pricing</main>;
}

// good
export const metadata = { title: "Pricing" };
export default function Page() {
  return <main>Pricing</main>;
}
```

### react-doctor/nextjs-no-a-element

Disallow plain anchor elements for internal navigation; use next/link. Severity: `warn`.

```tsx
// bad
<a href="/dashboard">Dashboard</a>

// good
<Link href="/dashboard">Dashboard</Link>
```

### react-doctor/nextjs-no-client-fetch-for-server-data

Disallow fetching server-renderable data in client effects; fetch in a Server Component instead. Severity: `warn`.

```tsx
// bad
"use client";
useEffect(() => {
  fetch("/api/posts")
    .then((r) => r.json())
    .then(setPosts);
}, []);

// good
export default async function Page() {
  const posts = await getPosts();
  return <PostList posts={posts} />;
}
```

### react-doctor/nextjs-no-client-side-redirect

Disallow auth redirects via router.push in a useEffect; redirect in middleware or on the server. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  if (!session) router.push("/login");
}, [session]);

// good
if (!session) redirect("/login");
```

### react-doctor/nextjs-no-default-export-in-route-handler

Disallow default exports in route handlers; export named HTTP methods. Severity: `error`.

```ts
// bad
export default function handler(req) {
  return Response.json({ ok: true });
}

// good
export async function GET() {
  return Response.json({ ok: true });
}
```

### react-doctor/nextjs-no-edge-og-runtime

Disallow forcing the edge runtime just for OG image generation; it works in the default runtime. Severity: `warn`.

```ts
// bad
export const runtime = "edge";
export async function GET() {
  return new ImageResponse(<div>OG</div>);
}

// good
export async function GET() {
  return new ImageResponse(<div>OG</div>);
}
```

### react-doctor/nextjs-no-font-link

Disallow loading fonts via link tags; use next/font. Severity: `warn`.

```tsx
// bad
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />;

// good
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
```

### react-doctor/nextjs-no-head-import

Disallow importing next/head in the App Router; use the Metadata API. Severity: `error`.

```tsx
// bad
import Head from "next/head";
<Head>
  <title>Pricing</title>
</Head>;

// good
export const metadata = { title: "Pricing" };
```

### react-doctor/nextjs-no-native-script

Disallow native script tags; use next/script. Severity: `warn`.

```tsx
// bad
<script src="https://example.com/widget.js" />

// good
<Script src="https://example.com/widget.js" strategy="lazyOnload" />
```

### react-doctor/nextjs-no-redirect-in-try-catch

Disallow calling redirect() inside a try/catch, which swallows the internal throw it relies on. Severity: `warn`.

```ts
// bad
try {
  await save(data);
  redirect("/done");
} catch (e) {
  log(e);
}

// good
try {
  await save(data);
} catch (e) {
  log(e);
}
redirect("/done");
```

### react-doctor/nextjs-no-script-in-head

Disallow placing next/script inside a head element. Severity: `error`.

```tsx
// bad
<head>
  <Script src="/analytics.js" />
</head>

// good
<body>
  <Script src="/analytics.js" strategy="afterInteractive" />
</body>
```

### react-doctor/nextjs-no-side-effect-in-get-handler

Disallow mutations or other side effects in GET route handlers; use POST or a Server Action. Severity: `error`.

```ts
// bad
export async function GET() {
  await db.user.delete({ where: { id } });
  return Response.json({ ok: true });
}

// good
export async function POST() {
  await db.user.delete({ where: { id } });
  return Response.json({ ok: true });
}
```

### react-doctor/nextjs-no-use-search-params-without-suspense

Require a Suspense boundary around components that call useSearchParams. Severity: `warn`.

```tsx
// bad
<SearchResults />

// good
<Suspense fallback={<Skeleton />}>
  <SearchResults />
</Suspense>
```

### react-doctor/nextjs-no-vercel-og-import

Disallow importing from @vercel/og; use ImageResponse from next/og. Severity: `warn`.

```ts
// bad
import { ImageResponse } from "@vercel/og";

// good
import { ImageResponse } from "next/og";
```

## React Doctor: Security

### react-doctor/active-static-asset

Disallow serving user-controlled files as active, script-capable content. Severity: `warn`.

```ts
// bad
res.setHeader("Content-Type", "image/svg+xml");
res.send(userUpload);

// good
res.setHeader("Content-Type", "application/octet-stream");
res.setHeader("Content-Disposition", "attachment");
res.send(userUpload);
```

### react-doctor/agent-tool-capability-risk

Restrict AI agent tools to allowlisted capabilities instead of executing arbitrary input. Severity: `warn`.

```ts
// bad
const shellTool = { name: "shell", execute: (input) => exec(input.command) };

// good
const shellTool = { name: "shell", execute: (input) => ALLOWED_COMMANDS[input.command]?.() };
```

### react-doctor/artifact-baas-authority-surface

Disallow shipping backend-as-a-service admin authority such as service-role keys in client code. Severity: `warn`.

```tsx
// bad
"use client";
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// good
("use client");
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

### react-doctor/artifact-env-leak

Disallow inlining server environment variables into client build artifacts. Severity: `error`.

```tsx
// bad
"use client";
const apiKey = process.env.API_SECRET;

// good
// server route only
const apiKey = process.env.API_SECRET;
```

### react-doctor/artifact-secret-leak

Disallow secret values appearing in emitted build artifacts. Severity: `error`.

```ts
// bad
const config = { apiKey: "sk_live_YOUR_API_TOKEN_HERE" };

// good
const config = { apiKey: process.env.STRIPE_SECRET_KEY };
```

### react-doctor/auth-token-in-web-storage

Disallow storing authentication tokens in localStorage or sessionStorage. Severity: `warn`.

```ts
// bad
localStorage.setItem("accessToken", token);

// good
// server sets an httpOnly cookie; the client never touches the token
await fetch("/api/session", { method: "POST", credentials: "include" });
```

### react-doctor/build-pipeline-secret-boundary

Disallow passing server secrets across the build pipeline boundary into bundled output. Severity: `warn`.

```ts
// bad
define: { "process.env.API_SECRET": JSON.stringify(process.env.API_SECRET) }

// good
define: { "process.env.PUBLIC_API_URL": JSON.stringify(process.env.PUBLIC_API_URL) }
```

### react-doctor/clickjacking-redirect-risk

Require frame protection and target validation on parameter-driven redirect endpoints. Severity: `warn`.

```ts
// bad
app.get("/go", (req, res) => res.redirect(req.query.next));

// good
app.get("/go", (req, res) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.redirect(toInternalPath(req.query.next));
});
```

### react-doctor/command-execution-input-risk

Disallow passing untrusted input into shell command execution. Severity: `error`.

```ts
// bad
exec(`git clone ${req.query.repo}`);

// good
execFile("git", ["clone", validatedRepoUrl]);
```

### react-doctor/cors-cookie-trust-risk

Disallow reflecting arbitrary origins in credentialed CORS responses. Severity: `warn`.

```ts
// bad
res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
res.setHeader("Access-Control-Allow-Credentials", "true");

// good
if (ALLOWED_ORIGINS.has(req.headers.origin)) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
}
```

### react-doctor/dangerous-html-sink

Disallow injecting untrusted data into raw HTML sinks. Severity: `warn`.

```tsx
// bad
<div dangerouslySetInnerHTML={{ __html: userBio }} />

// good
<div>{userBio}</div>
```

### react-doctor/git-provider-url-injection-risk

Disallow interpolating unvalidated input into git provider URLs and clone commands. Severity: `warn`.

```ts
// bad
await exec(`git clone https://github.com/${req.query.repo}.git`);

// good
const [owner, name] = parseRepoSlug(req.query.repo);
await execFile("git", ["clone", `https://github.com/${owner}/${name}.git`]);
```

### react-doctor/import-metadata-execution-risk

Disallow dynamically importing module paths taken from untrusted metadata. Severity: `error`.

```ts
// bad
const plugin = await import(manifest.pluginPath);

// good
const load = KNOWN_PLUGINS[manifest.pluginName];
const plugin = load ? await load() : null;
```

### react-doctor/insecure-crypto-risk

Disallow weak cryptographic primitives and non-cryptographic randomness for security-sensitive values. Severity: `warn`.

```ts
// bad
const resetToken = Math.random().toString(36).slice(2);

// good
const resetToken = crypto.randomBytes(32).toString("hex");
```

### react-doctor/insecure-session-cookie

Require httpOnly, secure, and sameSite attributes on session cookies. Severity: `warn`.

```ts
// bad
res.cookie("session", sessionId);

// good
res.cookie("session", sessionId, { httpOnly: true, secure: true, sameSite: "lax" });
```

### react-doctor/jwt-insecure-verification

Require verified JWT decoding with pinned algorithms instead of unverified decode. Severity: `error`.

```ts
// bad
const payload = jwt.decode(token);

// good
const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
```

### react-doctor/key-lifecycle-risk

Disallow hardcoded or unrotatable cryptographic key material; load keys from a managed key store. Severity: `error`.

```ts
// bad
const encryptionKey = "YOUR_STATIC_KEY_HERE";

// good
const encryptionKey = await kms.getKey(process.env.KMS_KEY_ID);
```

### react-doctor/local-rpc-native-bridge-risk

Disallow exposing unrestricted native capabilities over local RPC bridges reachable by untrusted content. Severity: `warn`.

```ts
// bad
ipcMain.handle("run", (_event, command) => exec(command));

// good
ipcMain.handle("run", (_event, action) => ALLOWED_ACTIONS[action]?.());
```

### react-doctor/mcp-tool-capability-risk

Constrain MCP tool capabilities to validated, scoped operations. Severity: `warn`.

```ts
// bad
server.tool("write_file", ({ path, content }) => fs.writeFile(path, content));

// good
server.tool("write_file", ({ path, content }) =>
  fs.writeFile(resolveInside(WORKSPACE_DIR, path), content),
);
```

### react-doctor/mdx-ssr-execution-risk

Disallow evaluating untrusted MDX on the server, where it executes as code. Severity: `warn`.

```tsx
// bad
const { default: Content } = await evaluate(userMdx, runtime);

// good
const html = await renderSanitizedMarkdown(userMarkdown);
```

### react-doctor/no-path-prefix-containment

Disallow prefix string checks for path containment; resolve the path before comparing against the base directory. Severity: `warn`.

```ts
// bad
if (requested.startsWith(UPLOADS_DIR)) return fs.readFile(requested);

// good
const resolved = path.resolve(UPLOADS_DIR, requested);
if (resolved.startsWith(UPLOADS_DIR + path.sep)) return fs.readFile(resolved);
```

### react-doctor/no-secrets-in-client-code

Disallow secret keys and credentials in client-delivered code. Severity: `warn`.

```tsx
// bad
"use client";
const OPENAI_KEY = "sk-YOUR_API_TOKEN_HERE";

// good
("use client");
const res = await fetch("/api/ai", { method: "POST", body });
```

### react-doctor/nosql-injection-risk

Disallow passing untrusted objects directly into NoSQL query operators. Severity: `warn`.

```ts
// bad
await db.users.findOne({ username: req.body.username, password: req.body.password });

// good
await db.users.findOne({ username: String(req.body.username) });
```

### react-doctor/package-metadata-secret

Disallow secrets embedded in package metadata such as package.json scripts. Severity: `warn`.

```ts
// bad
{ "scripts": { "deploy": "NPM_TOKEN=YOUR_API_TOKEN_HERE npm publish" } }

// good
{ "scripts": { "deploy": "npm publish" } }
```

### react-doctor/path-traversal-risk

Disallow building filesystem paths from untrusted input without normalization. Severity: `warn`.

```ts
// bad
await fs.readFile(path.join(UPLOADS_DIR, req.query.name));

// good
await fs.readFile(path.join(UPLOADS_DIR, path.basename(req.query.name)));
```

### react-doctor/plugin-update-trust-risk

Require integrity verification before loading remotely fetched plugin updates. Severity: `warn`.

```ts
// bad
const code = await fetch(pluginUpdateUrl).then((r) => r.text());
runPlugin(code);

// good
const pkg = await fetch(pluginUpdateUrl).then((r) => r.arrayBuffer());
if (verifySignature(pkg, PUBLISHER_PUBLIC_KEY)) runPlugin(pkg);
```

### react-doctor/postmessage-origin-risk

Require origin validation in postMessage handlers. Severity: `warn`.

```ts
// bad
window.addEventListener("message", (e) => applyState(e.data));

// good
window.addEventListener("message", (e) => {
  if (e.origin === "https://trusted.example.com") applyState(e.data);
});
```

### react-doctor/public-debug-artifact

Disallow shipping debug endpoints or artifacts in production builds. Severity: `warn`.

```ts
// bad
app.get("/debug/state", (req, res) => res.json(internalState));

// good
if (process.env.NODE_ENV !== "production") {
  app.get("/debug/state", (req, res) => res.json(internalState));
}
```

### react-doctor/public-env-secret-name

Disallow secret-sounding names under public environment variable prefixes. Severity: `warn`.

```ts
// bad
const key = process.env.NEXT_PUBLIC_API_SECRET;

// good
const key = process.env.API_SECRET;
```

### react-doctor/raw-sql-injection-risk

Disallow interpolating untrusted input into raw SQL strings; use parameterized queries. Severity: `warn`.

```ts
// bad
await db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);

// good
await db.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
```

### react-doctor/react-markdown-unsanitized-raw-html

Require sanitization when enabling raw HTML in react-markdown. Severity: `warn`.

```tsx
// bad
<ReactMarkdown rehypePlugins={[rehypeRaw]}>{userContent}</ReactMarkdown>

// good
<ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>{userContent}</ReactMarkdown>
```

### react-doctor/repository-secret-file

Disallow committing secret-bearing files to the repository. Severity: `error`.

```ts
// bad
// .env checked into git
DATABASE_URL=postgres://admin:YOUR_PASSWORD_HERE@db.example.com/app

// good
// .gitignore
.env
```

### react-doctor/request-body-mass-assignment

Disallow writing the whole request body into a database record; pick allowed fields explicitly. Severity: `warn`.

```ts
// bad
await db.user.update({ where: { id }, data: req.body });

// good
await db.user.update({ where: { id }, data: { name: req.body.name, bio: req.body.bio } });
```

### react-doctor/secret-in-fallback

Disallow hardcoded secret fallbacks for missing environment variables. Severity: `error`.

```ts
// bad
const secret = process.env.JWT_SECRET ?? "YOUR_JWT_SECRET_HERE";

// good
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is not set");
```

### react-doctor/svg-filter-clickjacking-risk

Disallow rendering untrusted SVG markup inline, where filters can overlay and hijack clicks. Severity: `warn`.

```tsx
// bad
<div dangerouslySetInnerHTML={{ __html: userSvg }} />

// good
<img src={sanitizedSvgUrl} alt="User graphic" />
```

### react-doctor/tenant-static-proxy-risk

Disallow proxying tenant-controlled static content through the application's shared origin. Severity: `warn`.

```ts
// bad
app.get("/t/:tenant/:asset", (req, res) => proxyTo(storageUrl(req.params), res));

// good
app.get("/t/:tenant/:asset", (req, res) =>
  res.redirect(`https://${req.params.tenant}.usercontent.example.com/${req.params.asset}`),
);
```

### react-doctor/unsafe-json-in-html

Escape serialized JSON before embedding it in inline script HTML. Severity: `warn`.

```tsx
// bad
<script dangerouslySetInnerHTML={{ __html: `window.__DATA__=${JSON.stringify(data)}` }} />;

// good
const safe = JSON.stringify(data).replace(/</g, "\\u003c");
<script dangerouslySetInnerHTML={{ __html: `window.__DATA__=${safe}` }} />;
```

### react-doctor/untrusted-redirect-following

Disallow silently following redirects when fetching untrusted URLs on the server. Severity: `warn`.

```ts
// bad
const res = await fetch(userProvidedUrl);

// good
const res = await fetch(validatedUrl, { redirect: "error" });
```

### react-doctor/url-prefilled-privileged-action

Disallow auto-executing privileged actions from URL parameters without explicit user confirmation. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  if (searchParams.get("action") === "delete") deleteAccount();
}, []);

// good
{
  searchParams.get("action") === "delete" && <ConfirmDeleteDialog onConfirm={deleteAccount} />;
}
```

### react-doctor/webhook-signature-risk

Require signature verification before processing webhook payloads. Severity: `warn`.

```ts
// bad
app.post("/webhook", (req, res) => handleEvent(req.body));

// good
app.post("/webhook", (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers["stripe-signature"],
    WEBHOOK_SECRET,
  );
  handleEvent(event);
});
```

### react-doctor/window-open-without-noopener

Require noopener when opening external windows. Severity: `warn`.

```ts
// bad
window.open(url, "_blank");

// good
window.open(url, "_blank", "noopener,noreferrer");
```

## React Doctor: Server Components and Server Code

### react-doctor/server-after-nonblocking

Run non-blocking side work with after() instead of awaiting it in the request path. Severity: `warn`.

```ts
// bad
export async function POST(req: Request) {
  await logAnalytics(req);
  return Response.json({ ok: true });
}

// good
export async function POST(req: Request) {
  after(() => logAnalytics(req));
  return Response.json({ ok: true });
}
```

### react-doctor/server-auth-actions

Require authorization checks inside server actions. Severity: `error`.

```ts
// bad
"use server";
export async function deletePost(id: string) {
  await db.post.delete({ where: { id } });
}

// good
("use server");
export async function deletePost(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  await db.post.delete({ where: { id } });
}
```

### react-doctor/server-cache-with-object-literal

Disallow object-literal arguments to cache()-wrapped functions since cache keys compare by identity. Severity: `warn`.

```ts
// bad
const getUser = cache(async (opts: { id: string }) => db.user.find(opts.id));
const user = await getUser({ id });

// good
const getUser = cache(async (id: string) => db.user.find(id));
const user = await getUser(id);
```

### react-doctor/server-dedup-props

Deduplicate data access with cache() instead of threading the same fetched object through many props. Severity: `warn`.

```tsx
// bad
const user = await fetchUser(id);
return (
  <Layout user={user}>
    <Profile user={user} />
    <Sidebar user={user} />
  </Layout>
);

// good
const getUser = cache(fetchUser);
// each server component awaits getUser(id) where it needs the data
```

### react-doctor/server-fetch-without-revalidate

Require an explicit caching strategy on server fetch calls. Severity: `warn`.

```ts
// bad
const res = await fetch("https://api.example.com/posts");

// good
const res = await fetch("https://api.example.com/posts", { next: { revalidate: 60 } });
```

### react-doctor/server-hoist-static-io

Hoist request-independent IO to module scope instead of repeating it in every request handler. Severity: `warn`.

```ts
// bad
export async function GET() {
  const template = await fs.readFile("./template.html", "utf8");
  return new Response(template);
}

// good
const template = await fs.readFile("./template.html", "utf8");
export async function GET() {
  return new Response(template);
}
```

### react-doctor/server-no-mutable-module-state

Disallow mutable module-level state in server code shared across requests. Severity: `error`.

```ts
// bad
let currentUser: User | null = null;
export async function GET(req: Request) {
  currentUser = await getUser(req);
  return Response.json(currentUser);
}

// good
export async function GET(req: Request) {
  const currentUser = await getUser(req);
  return Response.json(currentUser);
}
```

### react-doctor/server-sequential-independent-await

Run independent awaits in parallel instead of sequentially. Severity: `warn`.

```ts
// bad
const user = await getUser(id);
const posts = await getPosts(id);

// good
const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);
```

## React Doctor: State and Effects

### react-doctor/activity-wraps-effect-heavy-subtree

Wrap effect-heavy offscreen subtrees in Activity instead of mounting and unmounting them. Severity: `warn`.

```tsx
// bad
{
  isOpen && <HeavyPanel />;
}

// good
<Activity mode={isOpen ? "visible" : "hidden"}>
  <HeavyPanel />
</Activity>;
```

### react-doctor/advanced-event-handler-refs

Keep the latest event handler in a ref so long-lived subscriptions do not resubscribe on every handler change. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  socket.on("message", onMessage);
  return () => socket.off("message", onMessage);
}, [onMessage]);

// good
const handlerRef = useRef(onMessage);
handlerRef.current = onMessage;
useEffect(() => {
  const handler = (m) => handlerRef.current(m);
  socket.on("message", handler);
  return () => socket.off("message", handler);
}, []);
```

### react-doctor/effect-needs-cleanup

Require cleanup functions in effects that subscribe, listen, or start timers. Severity: `error`.

```tsx
// bad
useEffect(() => {
  window.addEventListener("resize", onResize);
}, []);

// good
useEffect(() => {
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);
```

### react-doctor/hooks-no-nan-in-deps

Disallow possibly-NaN values in dependency arrays, since NaN never equals itself and retriggers the hook every render. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  draw(Number(input));
}, [Number(input)]);

// good
const parsed = Number(input);
const value = Number.isNaN(parsed) ? 0 : parsed;
useEffect(() => {
  draw(value);
}, [value]);
```

### react-doctor/no-adjust-state-on-prop-change

Disallow resetting state in an effect when a prop changes; adjust it during render instead. Severity: `error`.

```tsx
// bad
useEffect(() => {
  setSelection(null);
}, [items]);

// good
const [prevItems, setPrevItems] = useState(items);
if (items !== prevItems) {
  setPrevItems(items);
  setSelection(null);
}
```

### react-doctor/no-cascading-set-state

Disallow effects that copy computable values into state, causing cascading render passes. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  setTotal(items.length);
}, [items]);
useEffect(() => {
  setIsEmpty(total === 0);
}, [total]);

// good
const total = items.length;
const isEmpty = total === 0;
```

### react-doctor/no-chain-state-updates

Disallow chaining dependent setState calls when the follow-up value can be derived during render. Severity: `warn`.

```tsx
// bad
const handleClick = () => {
  setCount(count + 1);
  setIsEven((count + 1) % 2 === 0);
};

// good
const handleClick = () => setCount(count + 1);
const isEven = count % 2 === 0;
```

### react-doctor/no-create-context-in-render

Disallow creating contexts inside a component render. Severity: `error`.

```tsx
// bad
function App() {
  const ThemeContext = createContext("light");
  return (
    <ThemeContext value="dark">
      <Page />
    </ThemeContext>
  );
}

// good
const ThemeContext = createContext("light");
function App() {
  return (
    <ThemeContext value="dark">
      <Page />
    </ThemeContext>
  );
}
```

### react-doctor/no-create-store-in-render

Disallow creating stores inside a component render. Severity: `error`.

```tsx
// bad
function App() {
  const store = createStore(rootReducer);
  return (
    <Provider store={store}>
      <Page />
    </Provider>
  );
}

// good
const store = createStore(rootReducer);
function App() {
  return (
    <Provider store={store}>
      <Page />
    </Provider>
  );
}
```

### react-doctor/no-derived-state

Derive values during render instead of mirroring them into state. Severity: `warn`.

```tsx
// bad
const [fullName, setFullName] = useState("");
const handleFirstChange = (v) => {
  setFirst(v);
  setFullName(v + " " + last);
};

// good
const fullName = first + " " + last;
```

### react-doctor/no-derived-state-effect

Disallow syncing derived values into state with an effect; compute them during render. Severity: `warn`.

```tsx
// bad
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(first + " " + last);
}, [first, last]);

// good
const fullName = first + " " + last;
```

### react-doctor/no-derived-useState

Disallow storing a computable value in useState; compute it during render. Severity: `warn`.

```tsx
// bad
const [visibleTodos, setVisibleTodos] = useState(filterTodos(todos, filter));

// good
const visibleTodos = filterTodos(todos, filter);
```

### react-doctor/no-direct-state-mutation

Disallow mutating state objects and arrays; create new values instead. Severity: `warn`.

```tsx
// bad
items.push(newItem);
setItems(items);

// good
setItems([...items, newItem]);
```

### react-doctor/no-effect-chain

Disallow effect chains where each effect sets state that triggers the next; compute everything in the originating event. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  if (card) setGoldCount(goldCount + 1);
}, [card]);
useEffect(() => {
  if (goldCount > 3) setRound(round + 1);
}, [goldCount]);

// good
const handlePlaceCard = (nextCard) => {
  setCard(nextCard);
  setGoldCount((c) => c + 1);
  if (goldCount + 1 > 3) setRound((r) => r + 1);
};
```

### react-doctor/no-effect-event-handler

Handle user-triggered logic in the event handler instead of reacting to state changes in an effect. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  if (product.isInCart) showNotification(`Added ${product.name}`);
}, [product]);

// good
const handleBuy = () => {
  addToCart(product);
  showNotification(`Added ${product.name}`);
};
```

### react-doctor/no-effect-event-in-deps

Disallow useEffectEvent functions in dependency arrays. Severity: `error`.

```tsx
// bad
const onTick = useEffectEvent(() => setCount(count + 1));
useEffect(() => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}, [onTick]);

// good
const onTick = useEffectEvent(() => setCount(count + 1));
useEffect(() => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}, []);
```

### react-doctor/no-effect-with-fresh-deps

Disallow effect dependencies recreated on every render; move the value inside the effect or depend on its primitives. Severity: `error`.

```tsx
// bad
const options = { serverUrl, roomId };
useEffect(() => {
  connect(options);
}, [options]);

// good
useEffect(() => {
  connect({ serverUrl, roomId });
}, [serverUrl, roomId]);
```

### react-doctor/no-event-handler

Attach event handlers with JSX props instead of adding DOM listeners in effects. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  buttonRef.current.addEventListener("click", handleClick);
  return () => buttonRef.current?.removeEventListener("click", handleClick);
}, []);

// good
<button onClick={handleClick}>Save</button>;
```

### react-doctor/no-event-trigger-state

Disallow storing an event-occurred flag in state and reacting to it in an effect; handle the event directly. Severity: `warn`.

```tsx
// bad
const [shouldSend, setShouldSend] = useState(false);
useEffect(() => { if (shouldSend) sendMessage(text); }, [shouldSend]);
<button onClick={() => setShouldSend(true)}>Send</button>

// good
<button onClick={() => sendMessage(text)}>Send</button>
```

### react-doctor/no-fetch-in-effect

Disallow ad-hoc data fetching in effects; use a data-fetching library or framework loader. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  fetch(`/api/user/${id}`)
    .then((r) => r.json())
    .then(setUser);
}, [id]);

// good
const { data: user } = useQuery({ queryKey: ["user", id], queryFn: () => fetchUser(id) });
```

### react-doctor/no-initialize-state

Initialize state in useState instead of setting it from a mount effect. Severity: `warn`.

```tsx
// bad
const [name, setName] = useState("");
useEffect(() => {
  setName(defaultName);
}, []);

// good
const [name, setName] = useState(defaultName);
```

### react-doctor/no-mirror-prop-effect

Disallow mirroring a prop into state with an effect; read the prop directly. Severity: `warn`.

```tsx
// bad
const [color, setColor] = useState(propColor);
useEffect(() => {
  setColor(propColor);
}, [propColor]);

// good
const color = propColor;
```

### react-doctor/no-mutable-in-deps

Disallow mutable values such as ref.current in dependency arrays. Severity: `error`.

```tsx
// bad
useEffect(() => {
  observer.observe(ref.current);
}, [ref.current]);

// good
useEffect(() => {
  observer.observe(ref.current);
}, []);
```

### react-doctor/no-mutating-reducer-state

Disallow mutating state inside reducers; return new state objects. Severity: `error`.

```ts
// bad
case "add":
  state.items.push(action.item);
  return state;

// good
case "add":
  return { ...state, items: [...state.items, action.item] };
```

### react-doctor/no-pass-data-to-parent

Disallow pushing fetched data up to the parent through effects; fetch in the parent and pass data down. Severity: `warn`.

```tsx
// bad
function Child({ onFetched }) {
  const data = useSomeAPI();
  useEffect(() => {
    onFetched(data);
  }, [onFetched, data]);
}

// good
function Parent() {
  const data = useSomeAPI();
  return <Child data={data} />;
}
```

### react-doctor/no-pass-live-state-to-parent

Disallow streaming a child's live state to the parent through an effect; lift the state up instead. Severity: `warn`.

```tsx
// bad
function Child({ onValueChange }) {
  const [value, setValue] = useState("");
  useEffect(() => {
    onValueChange(value);
  }, [value]);
}

// good
function Parent() {
  const [value, setValue] = useState("");
  return <Child value={value} onChange={setValue} />;
}
```

### react-doctor/no-prop-callback-in-effect

Disallow calling prop callbacks from effects; call them in the event that caused the change. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  onChange(isOn);
}, [isOn, onChange]);

// good
const handleToggle = () => {
  setIsOn(!isOn);
  onChange(!isOn);
};
```

### react-doctor/no-reset-all-state-on-prop-change

Reset component state on identity change with a key instead of clearing every state in an effect. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  setComment("");
  setDraft(null);
}, [userId]);

// good
<Profile userId={userId} key={userId} />;
```

### react-doctor/no-self-updating-effect

Disallow effects that set the same state they depend on, which loops forever. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  setCount(count + 1);
}, [count]);

// good
useEffect(() => {
  setCount((c) => c + 1);
}, []);
```

### react-doctor/no-set-state-in-render

Disallow calling setState during render; derive the value instead. Severity: `warn`.

```tsx
// bad
function List({ items }) {
  setCount(items.length);
  return <ul>{items.map(renderItem)}</ul>;
}

// good
const count = items.length;
```

### react-doctor/prefer-use-effect-event

Wrap non-reactive effect logic in useEffectEvent so it reads fresh values without retriggering the effect. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  const conn = createConnection(roomId);
  conn.on("connected", () => notify(theme));
  return () => conn.disconnect();
}, [roomId, theme]);

// good
const onConnected = useEffectEvent(() => notify(theme));
useEffect(() => {
  const conn = createConnection(roomId);
  conn.on("connected", onConnected);
  return () => conn.disconnect();
}, [roomId]);
```

### react-doctor/prefer-use-sync-external-store

Subscribe to external stores with useSyncExternalStore instead of useState plus effect listeners. Severity: `warn`.

```tsx
// bad
const [online, setOnline] = useState(navigator.onLine);
useEffect(() => {
  const update = () => setOnline(navigator.onLine);
  window.addEventListener("online", update);
  return () => window.removeEventListener("online", update);
}, []);

// good
const online = useSyncExternalStore(subscribeToOnline, () => navigator.onLine);
```

### react-doctor/prefer-useReducer

Consolidate interdependent useState calls into a reducer. Severity: `warn`.

```tsx
// bad
const [items, setItems] = useState([]);
const [selected, setSelected] = useState(null);
const [status, setStatus] = useState("idle");

// good
const [state, dispatch] = useReducer(listReducer, initialState);
```

### react-doctor/redux-useselector-inline-derivation

Move expensive derivations out of inline useSelector callbacks into memoized selectors. Severity: `warn`.

```tsx
// bad
const total = useSelector((s) => s.items.reduce((sum, i) => sum + i.price, 0));

// good
const selectTotal = createSelector([(s) => s.items], (items) =>
  items.reduce((sum, i) => sum + i.price, 0),
);
const total = useSelector(selectTotal);
```

### react-doctor/redux-useselector-returns-new-collection

Disallow useSelector callbacks that return a new collection on every call. Severity: `warn`.

```tsx
// bad
const activeItems = useSelector((s) => s.items.filter((i) => i.active));

// good
const items = useSelector((s) => s.items);
const activeItems = useMemo(() => items.filter((i) => i.active), [items]);
```

### react-doctor/rerender-defer-reads-hook

Defer store reads to the point of use instead of subscribing the component to state it only needs inside handlers. Severity: `warn`.

```tsx
// bad
const items = useStore((s) => s.items);
const handleSave = () => save(items);

// good
const handleSave = () => save(useStore.getState().items);
```

### react-doctor/rerender-dependencies

Disallow unstable inline objects, arrays, and functions in hook dependency arrays. Severity: `error`.

```tsx
// bad
const handleSelect = (id) => onSelect(id);
useEffect(() => {
  register(handleSelect);
}, [handleSelect]);

// good
const handleSelect = useCallback((id) => onSelect(id), [onSelect]);
useEffect(() => {
  register(handleSelect);
}, [handleSelect]);
```

### react-doctor/rerender-functional-setstate

Use functional setState updates when the next value depends on the previous one. Severity: `warn`.

```tsx
// bad
setCount(count + 1);

// good
setCount((c) => c + 1);
```

### react-doctor/rerender-lazy-ref-init

Initialize expensive ref values lazily instead of constructing them on every render. Severity: `warn`.

```tsx
// bad
const playerRef = useRef(new VideoPlayer());

// good
const playerRef = useRef(null);
if (playerRef.current === null) playerRef.current = new VideoPlayer();
```

### react-doctor/rerender-lazy-state-init

Pass an initializer function to useState instead of computing the initial value on every render. Severity: `warn`.

```tsx
// bad
const [todos, setTodos] = useState(loadTodos());

// good
const [todos, setTodos] = useState(() => loadTodos());
```

### react-doctor/rerender-state-only-in-handlers

Use a ref for values that are only read and written inside event handlers. Severity: `warn`.

```tsx
// bad
const [startX, setStartX] = useState(0);
const handleDown = (e) => setStartX(e.clientX);
const handleUp = (e) => report(e.clientX - startX);

// good
const startXRef = useRef(0);
const handleDown = (e) => {
  startXRef.current = e.clientX;
};
const handleUp = (e) => report(e.clientX - startXRef.current);
```

## React Doctor: TanStack Query

### react-doctor/query-destructure-result

Access fields off the useQuery result object instead of destructuring it. Severity: `error`.

```tsx
// bad
const { data, isLoading } = useQuery({ queryKey: ["todos"], queryFn: fetchTodos });

// good
const query = useQuery({ queryKey: ["todos"], queryFn: fetchTodos });
return query.isLoading ? <Spinner /> : <List items={query.data} />;
```

### react-doctor/query-mutation-missing-invalidation

Invalidate affected queries after a successful mutation. Severity: `warn`.

```tsx
// bad
useMutation({ mutationFn: addTodo });

// good
useMutation({
  mutationFn: addTodo,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
});
```

### react-doctor/query-no-query-in-effect

Disallow triggering queries from effects; declare them with useQuery. Severity: `warn`.

```tsx
// bad
useEffect(() => {
  queryClient.fetchQuery({ queryKey: ["user", id], queryFn: () => fetchUser(id) });
}, [id]);

// good
useQuery({ queryKey: ["user", id], queryFn: () => fetchUser(id) });
```

### react-doctor/query-no-rest-destructuring

Disallow rest destructuring of query results, which subscribes the component to every field. Severity: `warn`.

```tsx
// bad
const { data, ...rest } = useQuery({ queryKey: ["todos"], queryFn: fetchTodos });

// good
const { data, isLoading, isError } = useQuery({ queryKey: ["todos"], queryFn: fetchTodos });
```

### react-doctor/query-no-usequery-for-mutation

Use useMutation for data-changing operations instead of useQuery. Severity: `warn`.

```tsx
// bad
useQuery({ queryKey: ["deleteTodo", id], queryFn: () => deleteTodo(id) });

// good
const mutation = useMutation({ mutationFn: deleteTodo });
mutation.mutate(id);
```

### react-doctor/query-no-void-query-fn

Require query functions to return the fetched data. Severity: `warn`.

```tsx
// bad
useQuery({
  queryKey: ["todos"],
  queryFn: async () => {
    await fetch("/api/todos");
  },
});

// good
useQuery({ queryKey: ["todos"], queryFn: async () => (await fetch("/api/todos")).json() });
```

### react-doctor/query-stable-query-client

Create the QueryClient once outside render instead of on every render. Severity: `warn`.

```tsx
// bad
function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  );
}

// good
const queryClient = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  );
}
```

## React Doctor: Jotai

### react-doctor/jotai-derived-atom-returns-fresh-object

Disallow derived atoms that return a fresh object on every evaluation; use selectAtom with an equality function. Severity: `warn`.

```ts
// bad
const activeItemsAtom = atom((get) => ({ items: get(itemsAtom).filter((i) => i.active) }));

// good
const activeItemsAtom = selectAtom(itemsAtom, (items) => items.filter((i) => i.active), deepEquals);
```

### react-doctor/jotai-select-atom-in-render-body

Disallow calling selectAtom inside a component render; create the selected atom at module scope. Severity: `error`.

```tsx
// bad
function Profile() {
  const name = useAtomValue(selectAtom(userAtom, (u) => u.name));
}

// good
const nameAtom = selectAtom(userAtom, (u) => u.name);
function Profile() {
  const name = useAtomValue(nameAtom);
}
```

### react-doctor/jotai-tq-use-raw-query-atom

Read data from the raw query atom result instead of wrapping it in a data-only derived atom. Severity: `warn`.

```tsx
// bad
const todosAtom = atom((get) => get(todosQueryAtom).data);
const todos = useAtomValue(todosAtom);

// good
const todosQuery = useAtomValue(todosQueryAtom);
const todos = todosQuery.data;
```

## React Doctor: View Transitions

### react-doctor/no-document-start-view-transition

Use React's view transition integration instead of calling document.startViewTransition directly. Severity: `warn`.

```tsx
// bad
document.startViewTransition(() => {
  flushSync(() => setActiveTab(next));
});

// good
startTransition(() => setActiveTab(next));
```

### react-doctor/no-flush-sync

Disallow flushSync; it forces synchronous re-renders and defeats concurrent rendering. Severity: `warn`.

```tsx
// bad
flushSync(() => setCount(count + 1));

// good
setCount(count + 1);
```

## React Doctor: Zod v4

### react-doctor/zod-v4-no-deprecated-error-apis

Disallow Zod v3 error parameters such as required_error and invalid_type_error; use the unified error parameter. Severity: `warn`.

```ts
// bad
z.string({ required_error: "Name is required" });

// good
z.string({ error: "Name is required" });
```

### react-doctor/zod-v4-no-deprecated-error-customization

Disallow deprecated per-check message and errorMap customization; use the error parameter. Severity: `warn`.

```ts
// bad
z.string().min(5, { message: "Too short" });

// good
z.string().min(5, { error: "Too short" });
```

### react-doctor/zod-v4-no-deprecated-schema-apis

Disallow deprecated Zod v3 schema APIs in favor of their v4 replacements. Severity: `warn`.

```ts
// bad
const Schema = z.object({ name: z.string() }).strict();

// good
const Schema = z.strictObject({ name: z.string() });
```

### react-doctor/zod-v4-prefer-top-level-string-formats

Use top-level string format schemas instead of string method chains. Severity: `warn`.

```ts
// bad
const Email = z.string().email();

// good
const Email = z.email();
```

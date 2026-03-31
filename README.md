# oxlint-config-awesomeness

Opinionated Oxlint config for software houses that want all their apps to feel the same.

**493 rules** across **10 plugins**. Built for full-stack TypeScript monorepos with React, Next.js, Hono, Prisma, and more.

## Installation

```
npm install -D oxlint-config-awesomeness eslint-plugin-no-only-tests eslint-plugin-perfectionist eslint-plugin-react-hooks eslint-plugin-unused-imports
```

> [!NOTE]
> Due to a limitation in Oxlint's configuration resolver, you have to directly install the JS plugins for now.

## Usage

In your `oxlint.config.ts`:

```ts
import awesomeness from 'oxlint-config-awesomeness';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [awesomeness],
});
```

Then run `pnpm oxlint` or `npx oxlint`.

## Philosophy

- **Error, Never Warn.** Warnings are noise. Either it's an issue, or it isn't.
- **Category-Based, Future-Proof.** Five rule categories (`correctness`, `suspicious`, `pedantic`, `perf`, `style`) are enabled at `error`. Restriction rules are cherry-picked individually. New rules from categories are automatically included as oxlint evolves.
- **Opinionated for Consistency.** When multiple approaches exist, this config enforces the strictest option. All apps in your organization will feel the same.
- **Smart Overrides.** Test files, Storybook stories, seed scripts, config files, and E2E fixtures get relaxed rules where strict enforcement creates noise.
- **Formatter-Safe.** No formatting rules. Pair with [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for formatting.
- **Prevent Bugs.** Debug-only code like `console.log` or `test.only` are errors. Missing `throw`, bad comparisons, and floating promises are caught automatically.

## Plugins

| Plugin | Rules | Description |
|--------|-------|-------------|
| eslint (core) | 151 | JavaScript best practices and error prevention |
| unicorn | 112 | Modern JavaScript patterns and idioms |
| typescript | 80 | Strict type safety and TypeScript conventions |
| react | 44 | React component rules, hooks, and performance |
| jsx-a11y | 30 | Accessibility enforcement for JSX |
| import | 21 | Module hygiene and import/export conventions |
| nextjs | 21 | Next.js framework best practices |
| oxc | 19 | Bug-catching rules unique to oxlint |
| promise | 13 | Async/promise handling |
| node | 2 | Node.js environment rules |

Plus JS plugins: **perfectionist** (sorting), **react-hooks** + **React Compiler**, **no-only-tests**, **unused-imports**.

## File-Type Overrides

The config includes smart overrides so strict rules don't create noise in files that need flexibility:

| Files | Relaxed Rules |
|-------|---------------|
| `*.test.ts`, `*.spec.ts`, `__tests__/**` | `no-explicit-any`, all `no-unsafe-*`, `max-lines`, `max-statements`, `no-empty-function` |
| `*.stories.tsx` | `no-console`, `no-multi-comp` |
| `**/seed.ts`, `**/migrate.ts` | `no-console` |
| `*.config.ts`, `next.config.*`, etc. | `max-lines`, `no-anonymous-default-export` |
| `**/e2e/**/fixtures/**` | `rules-of-hooks` |
| `*.ts`, `*.tsx` (all TypeScript) | Rules handled natively by the TS compiler (`no-undef`, `no-redeclare`, etc.) |

## Cherry-Picked Restriction Rules

Instead of enabling the entire `restriction` category (which includes rules like `no-bitwise`, `no-plusplus`, `capitalized-comments` that cause daily friction), this config cherry-picks the most valuable restriction rules:

`curly`, `default-case`, `eqeqeq`, `grouped-accessor-pairs`, `id-length`, `max-classes-per-file`, `max-depth`, `max-lines`, `max-nested-callbacks`, `max-params`, `no-alert`, `no-caller`, `no-console`, `no-eval`, `no-extend-native`, `no-implicit-coercion`, `no-new-func`, `no-new-wrappers`, `no-object-constructor`, `no-param-reassign`, `no-proto`, `no-return-assign`, `no-script-url`, `no-shadow`, `no-throw-literal`, `no-void`, `prefer-promise-reject-errors`, `prefer-template`

## Sorting Rules Disabled

`sort-imports`, `sort-keys`, and `sort-vars` are disabled because sorting is handled by **perfectionist** (for objects, enums, interfaces, JSX props) and **oxfmt** (for import ordering).

## Unicorn Overrides

| Rule | Setting | Reason |
|------|---------|--------|
| `unicorn/filename-case` | kebab-case with Next.js exceptions | Allows `[slug]`, `[...catchAll]`, `_app` patterns |
| `unicorn/no-null` | off | APIs, JSON, and DOM all return `null` |

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
  set value(val) { this._value = val; }
};

// good
const obj = {
  get value() { return this._value; },
  set value(val) { this._value = val; }
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
  greet() { return 'hello'; }
}

// good
class Foo {
  greet() { return this.name; }
}
```

### complexity

Enforce a maximum cyclomatic complexity for functions.

```js
// bad
function check(a, b, c, d, e) {
  if (a) { if (b) { if (c) { if (d) { if (e) {} } } } }
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
  constructor() { this.x = 1; }
}

// good
class Child extends Parent {
  constructor() { super(); this.x = 1; }
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
  case 'run': run(); break;
}

// good
switch (action) {
  case 'run': run(); break;
  default: idle(); break;
}
```

### default-case-last

Enforce `default` clause to be the last case in `switch`.

```js
// bad
switch (action) {
  default: idle(); break;
  case 'run': run(); break;
}

// good
switch (action) {
  case 'run': run(); break;
  default: idle(); break;
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
if (x == 1) {}

// good
if (x === 1) {}
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
  set a(val) {}
};

// good
const obj = {
  get a() {},
  set a(val) {},
  b: 1
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
if (a) { if (b) { if (c) { if (d) { if (e) {} } } } }

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
fn(() => { fn(() => { fn(() => { fn(() => {}); }); }); });

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
alert('done');

// good
showNotification('done');
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
function fn() { return arguments.callee; }

// good
function fn() { return fn; }
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
Foo = 'bar';

// good
class Foo {}
const bar = 'bar';
```

### no-compare-neg-zero

Disallow comparing against `-0`.

```js
// bad
if (x === -0) {}

// good
if (Object.is(x, -0)) {}
```

### no-cond-assign

Disallow assignment operators in conditional statements.

```js
// bad
if (x = 0) {}

// good
if (x === 0) {}
```

### no-console

Disallow `console` usage in production code.

```js
// bad
console.log('debug');

// good
logger.info('debug');
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
if (true) {}

// good
if (isReady) {}
```

### no-constructor-return

Disallow returning a value from a constructor.

```js
// bad
class Foo {
  constructor() { return {}; }
}

// good
class Foo {
  constructor() { this.x = 1; }
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
if (a) {} else if (a) {}

// good
if (a) {} else if (b) {}
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
  case 1: break;
  case 1: break;
}

// good
switch (x) {
  case 1: break;
  case 2: break;
}
```

### no-duplicate-imports

Disallow duplicate module imports.

```js
// bad
import { a } from 'mod';
import { b } from 'mod';

// good
import { a, b } from 'mod';
```

### no-else-return

Disallow `else` blocks after `return` in `if`.

```js
// bad
if (x) { return a; } else { return b; }

// good
if (x) { return a; }
return b;
```

### no-empty

Disallow empty block statements.

```js
// bad
if (condition) {}

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
function noop() { /* Intentionally empty */ }
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
class Foo { static {} }

// good
class Foo { static { this.count = 0; } }
```

### no-eq-null

Disallow `== null` comparisons.

```js
// bad
if (x == null) {}

// good
if (x === null || x === undefined) {}
```

### no-eval

Disallow `eval()`.

```js
// bad
eval('alert("hi")');

// good
alert('hi');
```

### no-ex-assign

Disallow reassigning exceptions in `catch` clauses.

```js
// bad
try {} catch (e) { e = new Error(); }

// good
try {} catch (e) { const wrapped = new Error(); }
```

### no-extend-native

Disallow extending native objects.

```js
// bad
Array.prototype.first = function () {};

// good
function first(arr) { return arr[0]; }
```

### no-extra-bind

Disallow unnecessary `.bind()` calls.

```js
// bad
const fn = function () { return 1; }.bind(this);

// good
const fn = function () { return 1; };
```

### no-extra-boolean-cast

Disallow unnecessary boolean casts.

```js
// bad
if (!!x) {}

// good
if (x) {}
```

### no-extra-label

Disallow unnecessary labels.

```js
// bad
outer: while (true) { break outer; }

// good
while (true) { break; }
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
const str = '' + value;
const num = +value;

// good
const str = String(value);
const num = Number(value);
```

### no-import-assign

Disallow assigning to imported bindings.

```js
// bad
import { x } from 'mod';
x = 1;

// good
import { x } from 'mod';
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
if (test) { doSomething(); }
```

### no-invalid-regexp

Disallow invalid regular expression strings in `RegExp` constructors.

```js
// bad
new RegExp('[');

// good
new RegExp('[a-z]');
```

### no-irregular-whitespace

Disallow irregular whitespace characters.

```js
// bad
const desc = 'foo\u00A0bar';

// good
const desc = 'foo bar';
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
x: while (true) { break x; }

// good
loop: while (true) { break loop; }
```

### no-labels

Disallow labeled statements.

```js
// bad
outer: for (;;) { break outer; }

// good
for (;;) { break; }
```

### no-lone-blocks

Disallow unnecessary nested blocks.

```js
// bad
{ const x = 1; }

// good
const x = 1;
```

### no-lonely-if

Disallow `if` as the only statement in an `else` block.

```js
// bad
if (a) {} else { if (b) {} }

// good
if (a) {} else if (b) {}
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
let a = b = c = 1;

// good
let a = 1;
let b = 1;
let c = 1;
```

### no-multi-str

Disallow multiline strings using backslash.

```js
// bad
const str = 'line1 \
line2';

// good
const str = 'line1\nline2';
```

### no-negated-condition

Disallow negated conditions when an `else` is present.

```js
// bad
if (!x) { a(); } else { b(); }

// good
if (x) { b(); } else { a(); }
```

### no-nested-ternary

Disallow nested ternary expressions.

```js
// bad
const x = a ? b ? c : d : e;

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
const fn = new Function('a', 'return a');

// good
const fn = (a) => a;
```

### no-new-native-nonconstructor

Disallow `new` operators with `Symbol` and `BigInt`.

```js
// bad
const sym = new Symbol('desc');

// good
const sym = Symbol('desc');
```

### no-new-wrappers

Disallow primitive wrapper instances (`new String`, `new Number`, `new Boolean`).

```js
// bad
const str = new String('hello');

// good
const str = 'hello';
```

### no-nonoctal-decimal-escape

Disallow `\8` and `\9` escape sequences in string literals.

```js
// bad
const str = '\8';

// good
const str = '8';
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
function fn(x) { x = 10; }

// good
function fn(x) { const y = 10; }
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
new Promise((resolve) => { resolve(1); });
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
obj.hasOwnProperty('key');

// good
Object.hasOwn(obj, 'key');
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
function handler(event) { event.preventDefault(); }
```

### no-restricted-imports

Disallow specified modules when loaded by `import`.

```js
// bad
import _ from 'lodash';

// good
import groupBy from 'lodash/groupBy';
```

### no-return-assign

Disallow assignment operators in `return` statements.

```js
// bad
const fn = () => result = value;

// good
const fn = () => { result = value; };
```

### no-script-url

Disallow `javascript:` URLs.

```js
// bad
location.href = 'javascript:void(0)';

// good
location.href = '#';
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
if (x === x) {}

// good
if (Number.isNaN(x)) {}
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
const obj = { set x(val) { return val; } };

// good
const obj = { set x(val) { this._x = val; } };
```

### no-shadow

Disallow variable declarations from shadowing outer scope variables.

```js
// bad
const x = 1;
function fn() { const x = 2; }

// good
const x = 1;
function fn() { const y = 2; }
```

### no-shadow-restricted-names

Disallow shadowing restricted identifiers like `undefined`, `NaN`, `Infinity`.

```js
// bad
const undefined = 'foo';

// good
const undef = 'foo';
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
const msg = 'Hello ${name}';

// good
const msg = `Hello ${name}`;
```

### no-this-before-super

Disallow `this`/`super` before calling `super()` in constructors.

```js
// bad
class A extends B {
  constructor() { this.x = 1; super(); }
}

// good
class A extends B {
  constructor() { super(); this.x = 1; }
}
```

### no-throw-literal

Require throwing `Error` objects only.

```js
// bad
throw 'error';

// good
throw new Error('error');
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
const foo = bar
(1 + 2).toString();

// good
const foo = bar;
(1 + 2).toString();
```

### no-unmodified-loop-condition

Disallow unmodified conditions in loops.

```js
// bad
let x = true;
while (x) { doSomething(); }

// good
let x = true;
while (x) { x = doSomething(); }
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
try {} finally { return 1; }

// good
try {} finally { cleanup(); }
```

### no-unsafe-negation

Disallow negating the left operand of relational operators.

```js
// bad
if (!key in object) {}

// good
if (!(key in object)) {}
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
OUTER: for (;;) { break; }

// good
for (;;) { break; }
```

### no-unused-private-class-members

Disallow unused private class members.

```js
// bad
class Foo { #unused = 1; }

// good
class Foo {
  #count = 0;
  increment() { this.#count += 1; }
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
try { doSomething(); } catch (e) { throw e; }

// good
doSomething();
```

### no-useless-computed-key

Disallow unnecessary computed property keys.

```js
// bad
const obj = { ['a']: 1 };

// good
const obj = { a: 1 };
```

### no-useless-concat

Disallow unnecessary concatenation of strings.

```js
// bad
const str = 'a' + 'b';

// good
const str = 'ab';
```

### no-useless-constructor

Disallow unnecessary constructors.

```js
// bad
class Foo { constructor() {} }

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
import { foo as foo } from 'mod';

// good
import { foo } from 'mod';
```

### no-useless-return

Disallow redundant return statements.

```js
// bad
function fn() { doSomething(); return; }

// good
function fn() { doSomething(); }
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
with (obj) { foo = 1; }

// good
obj.foo = 1;
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
const x = parseInt('111110111', 2);

// good
const x = 0b111110111;
```

### prefer-object-has-own

Require `Object.hasOwn()` over `Object.prototype.hasOwnProperty.call()`.

```js
// bad
Object.prototype.hasOwnProperty.call(obj, 'key');

// good
Object.hasOwn(obj, 'key');
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
Promise.reject('error');

// good
Promise.reject(new Error('error'));
```

### prefer-rest-params

Require rest parameters instead of `arguments`.

```js
// bad
function fn() { return arguments; }

// good
function fn(...args) { return args; }
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
const msg = 'Hello ' + name;

// good
const msg = `Hello ${name}`;
```

### preserve-caught-error

Require a parameter in `catch` clauses.

```js
// bad
try {} catch { handleError(); }

// good
try {} catch (error) { handleError(error); }
```

### radix

Require the radix parameter in `parseInt()`.

```js
// bad
parseInt('071');

// good
parseInt('071', 10);
```

### require-await

Disallow `async` functions that have no `await` expression.

```js
// bad
async function fn() { return 1; }

// good
async function fn() { return await fetchData(); }
```

### require-yield

Require `yield` in generator functions.

```js
// bad
function* gen() { return 1; }

// good
function* gen() { yield 1; }
```

### symbol-description

Require a description when creating `Symbol`.

```js
// bad
const sym = Symbol();

// good
const sym = Symbol('id');
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
if (x === NaN) {}

// good
if (Number.isNaN(x)) {}
```

### valid-typeof

Enforce comparing `typeof` expressions against valid strings.

```js
// bad
typeof x === 'strig';

// good
typeof x === 'string';
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
if ('red' === color) {}

// good
if (color === 'red') {}
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
const x: number = 'hello';

// good
const x: number = Number('hello');
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
  get name() { return 'foo'; }
}

// good
class Foo {
  readonly name = 'foo';
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
import { User } from './types';

// good
import type { User } from './types';
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
const fn = () => 'hello';

// good
const fn = (): string => 'hello';
```

### @typescript-eslint/explicit-member-accessibility

Require explicit accessibility modifiers on class properties and methods.

```ts
// bad
class Foo { x = 1; }

// good
class Foo { public x = 1; }
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
const x = alert('hi');

// good
alert('hi');
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
enum E { A = 1, B = 1 }

// good
enum E { A = 1, B = 2 }
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
function noop(): void { /* Intentionally empty */ }
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
for (const i in arr) {}

// good
for (const item of arr) {}
```

### @typescript-eslint/no-import-type-side-effects

Enforce that type-only imports have inline `type` qualifiers.

```ts
// bad
import type { A, B } from 'mod';

// good
import { type A, type B } from 'mod';
```

### @typescript-eslint/no-inferrable-types

Disallow explicit types where they can be trivially inferred.

```ts
// bad
const x: number = 1;

// good
const x = 1;
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
for (let i = 0; i < 5; i++) { fns.push(makeFn(i)); }
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

Disallow magic numbers. *Disabled in this config.*

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
if (fetchData()) {}

// good
if (await fetchData()) {}
```

### @typescript-eslint/no-mixed-enums

Disallow enums from mixing string and number members.

```ts
// bad
enum E { A = 0, B = 'b' }

// good
enum E { A = 'a', B = 'b' }
```

### @typescript-eslint/no-namespace

Disallow TypeScript namespaces.

```ts
// bad
namespace Foo { export const x = 1; }

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
const fs = require('fs');

// good
import fs from 'fs';
```

### @typescript-eslint/no-restricted-imports

Disallow specified modules when loaded by `import` (TypeScript version).

```ts
// bad
import _ from 'lodash';

// good
import groupBy from 'lodash/groupBy';
```

### @typescript-eslint/no-shadow

Disallow variable shadowing (TypeScript version).

```ts
// bad
const x = 1;
const fn = () => { const x = 2; };

// good
const x = 1;
const fn = () => { const y = 2; };
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

Disallow type aliases in favor of interfaces. *Superseded by consistent-type-definitions.*

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
if (isReady === true) {}

// good
if (isReady) {}
```

### @typescript-eslint/no-unnecessary-condition

Disallow conditionals where the type is always truthy or always falsy.

```ts
// bad
const x = 'hello';
if (x) {}

// good
const x = getValue();
if (x) {}
```

### @typescript-eslint/no-unnecessary-qualifier

Disallow unnecessary namespace qualifiers.

```ts
// bad
namespace Foo {
  export type Bar = string;
  const x: Foo.Bar = 'hi';
}

// good
namespace Foo {
  export type Bar = string;
  const x: Bar = 'hi';
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
const x = 'hello' as string;

// good
const x = 'hello';
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
enum Status { Active }
if (status === 0) {}

// good
enum Status { Active }
if (status === Status.Active) {}
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
function fn(): string { return anyValue; }

// good
function fn(): string { return String(anyValue); }
```

### @typescript-eslint/no-unsafe-unary-minus

Disallow unary minus on non-numeric types.

```ts
// bad
const x: any = '5';
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
  constructor() { super(); }
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
const x = 'hello';
```

### @typescript-eslint/no-var-requires

Disallow `require` statements except in import statements.

```ts
// bad
const fs = require('fs');

// good
import fs from 'fs';
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
throw 'error';

// good
throw new Error('error');
```

### @typescript-eslint/parameter-properties

Require or disallow parameter properties in class constructors.

```ts
// bad
class Foo {
  x: number;
  constructor(x: number) { this.x = x; }
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
const x: 'hello' = 'hello';

// good
const x = 'hello' as const;
```

### @typescript-eslint/prefer-enum-initializers

Require initializers for each enum member.

```ts
// bad
enum Status { Active, Inactive }

// good
enum Status { Active = 0, Inactive = 1 }
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
interface Fn { (): void; }

// good
type Fn = () => void;
```

### @typescript-eslint/prefer-includes

Enforce using `includes()` over `indexOf() !== -1`.

```ts
// bad
if (arr.indexOf(item) !== -1) {}

// good
if (arr.includes(item)) {}
```

### @typescript-eslint/prefer-literal-enum-member

Enforce that enum members are literal values.

```ts
// bad
enum E { A = computed() }

// good
enum E { A = 'a' }
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
const x = value || 'default';

// good
const x = value ?? 'default';
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
class Foo { private x = 1; }

// good
class Foo { private readonly x = 1; }
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
'hello'.match(/ell/);

// good
/ell/.exec('hello');
```

### @typescript-eslint/prefer-return-this-type

Enforce that `this` is used as the return type when a class method returns `this`.

```ts
// bad
class Builder {
  set(): Builder { return this; }
}

// good
class Builder {
  set(): this { return this; }
}
```

### @typescript-eslint/prefer-string-starts-ends-with

Enforce using `startsWith()` and `endsWith()` over equivalent string methods.

```ts
// bad
if (str.indexOf('abc') === 0) {}

// good
if (str.startsWith('abc')) {}
```

### @typescript-eslint/prefer-ts-expect-error

Enforce using `@ts-expect-error` over `@ts-ignore`.

```ts
// bad
// @ts-ignore
const x: number = 'hello';

// good
// @ts-expect-error -- testing invalid input
const x: number = 'hello';
```

### @typescript-eslint/promise-function-async

Require functions that return Promises to be marked `async`.

```ts
// bad
function fn(): Promise<void> { return doWork(); }

// good
async function fn(): Promise<void> { return doWork(); }
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
const x = 'count: ' + 5;

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
type T = 'a' | 'b';
switch (x as T) {
  case 'a': break;
}

// good
type T = 'a' | 'b';
switch (x as T) {
  case 'a': break;
  case 'b': break;
}
```

### @typescript-eslint/triple-slash-reference

Disallow triple-slash reference directives.

```ts
// bad
/// <reference path="foo" />

// good
import foo from 'foo';
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
useEffect(() => { fetchData(id); }, []);

// good
useEffect(() => { fetchData(id); }, [id]);
```

### react/forward-ref-uses-ref

Require `forwardRef` components to use the `ref` parameter.

```tsx
// bad
const Comp = forwardRef((props, ref) => <div />);

// good
const Comp = forwardRef((props, ref) => <div ref={ref} />);
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
<Button onClick={() => handleClick(id)} />

// good
const handleButtonClick = useCallback(() => handleClick(id), [id]);
<Button onClick={handleButtonClick} />
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
{count && <Items count={count} />}

// good
{count > 0 && <Items count={count} />}
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
import { MyComponent } from './my-component';
const App = () => <MyComponent />;
```

### react/jsx-no-useless-fragment

Disallow unnecessary fragments.

```tsx
// bad
<>{child}</>

// good
{child}
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

Enforce alphabetical prop sorting. *Handled by perfectionist.*

### react/jsx-uses-vars

Mark variables used in JSX as used.

```tsx
// good
import { Component } from './component';
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
if (this.isMounted()) { this.setState({}); }

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
  shouldComponentUpdate() { return true; }
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
  render() { return <div />; }
}

// good
class Foo extends Component {
  render() { return <div />; }
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
class Comp extends Component { render() {} }
```

### react/prefer-stateless-function

Encourage stateless functional components.

```tsx
// bad
class Foo extends Component {
  render() { return <div>{this.props.name}</div>; }
}

// good
const Foo = ({ name }: Props) => <div>{name}</div>;
```

### react/require-render-return

Require `render` method to return a value.

```tsx
// bad
class Foo extends Component {
  render() { <div />; }
}

// good
class Foo extends Component {
  render() { return <div />; }
}
```

### react/rules-of-hooks

Enforce Rules of Hooks.

```tsx
// bad
if (condition) { useState(0); }

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
  static getDerivedStateFromError() { return { hasError: true }; }
}
```

### react-hooks-js/gating

Enforce gating patterns are compatible with the compiler.

```tsx
// bad
if (__DEV__) { useDebugHook(); }

// good
useDebugHook(__DEV__);
```

### react-hooks-js/globals

Enforce that global references are compatible with the compiler.

```tsx
// bad
function Comp() { return <div>{window.x}</div>; }

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
import { observer } from 'mobx-react';

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
  useEffect(() => { setX(1); }, []);
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
function Parent() { return <Header />; }
```

### react-hooks-js/unsupported-syntax

Flag syntax patterns not yet supported by the React Compiler.

```tsx
// bad
function Comp() {
  with (obj) { return <div />; }
}

// good
function Comp() { return <div>{obj.value}</div>; }
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
try {} catch (e) {}

// good
try {} catch (error) {}
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
if (arr.indexOf(item) >= 0) {}

// good
if (arr.includes(item)) {}
```

### unicorn/consistent-function-scoping

Move functions to the highest possible scope.

```js
// bad
function outer() {
  function inner(x) { return x * 2; }
  return inner(5);
}

// good
function inner(x) { return x * 2; }
function outer() { return inner(5); }
```

### unicorn/empty-brace-spaces

Enforce no spaces in empty braces.

```js
// bad
const obj = {  };

// good
const obj = {};
```

### unicorn/error-message

Require `Error` messages.

```js
// bad
throw new Error();

// good
throw new Error('Something went wrong');
```

### unicorn/escape-case

Require uppercase escape sequences.

```js
// bad
const str = '\xa9';

// good
const str = '\xA9';
```

### unicorn/explicit-length-check

Enforce explicitly comparing the `length` property.

```js
// bad
if (arr.length) {}

// good
if (arr.length > 0) {}
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
import * as path from 'path';

// good
import path from 'path';
```

### unicorn/new-for-builtins

Require `new` for builtins that need it, forbid for those that do not.

```js
// bad
const err = Error('fail');
const sym = new Symbol('x');

// good
const err = new Error('fail');
const sym = Symbol('x');
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
const nums = ['1', '2'].map(Number);

// good
const nums = ['1', '2'].map((x) => Number(x));
```

### unicorn/no-array-for-each

Prefer `for...of` over `Array.forEach`.

```js
// bad
items.forEach((item) => process(item));

// good
for (const item of items) { process(item); }
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
for (const n of arr) { sum += n; }
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
console.log(' hello ');

// good
console.log('hello');
```

### unicorn/no-document-cookie

Disallow `document.cookie` direct access.

```js
// bad
document.cookie = 'key=value';

// good
// Use a cookie library instead
```

### unicorn/no-empty-file

Disallow empty files.

```js
// bad
// empty file

// good
export const EMPTY = '';
```

### unicorn/no-for-loop

Prefer `for...of` over `for` loops with index access.

```js
// bad
for (let i = 0; i < arr.length; i++) {}

// good
for (const item of arr) {}
```

### unicorn/no-hex-escape

Enforce using Unicode escapes instead of hexadecimal escapes.

```js
// bad
const str = '\x1B';

// good
const str = '\u001B';
```

### unicorn/no-instanceof-array

Require `Array.isArray()` instead of `instanceof Array`.

```js
// bad
if (x instanceof Array) {}

// good
if (Array.isArray(x)) {}
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
el.removeEventListener('click', () => {});

// good
const handler = () => {};
el.addEventListener('click', handler);
el.removeEventListener('click', handler);
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
if (a) {} else { if (b) {} }

// good
if (a) {} else if (b) {}
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
if (!x) { a(); } else { b(); }

// good
if (x) { b(); } else { a(); }
```

### unicorn/no-negation-in-equality-check

Disallow negation in equality checks.

```js
// bad
if (!x === y) {}

// good
if (x !== y) {}
```

### unicorn/no-nested-ternary

Disallow nested ternary expressions.

```js
// bad
const x = a ? b ? c : d : e;

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
const buf = new Buffer('abc');

// good
const buf = Buffer.from('abc');
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
throw new Error('Fatal error');
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
class Utils { static format() {} }

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
if (typeof x === 'undefined') {}

// good
if (x === undefined) {}
```

### unicorn/no-unnecessary-await

Disallow awaiting non-promise values.

```js
// bad
const x = await 'hello';

// good
const x = 'hello';
```

### unicorn/no-unnecessary-polyfills

Disallow unnecessary polyfills based on target environments.

```js
// bad
import 'array-flat-polyfill';

// good
// Native Array.flat is available in your target
```

### unicorn/no-unreadable-array-destructuring

Disallow unreadable array destructuring.

```js
// bad
const [,, z] = arr;

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
async function fn() { return Promise.resolve(1); }

// good
async function fn() { return 1; }
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
  default: handle();
}

// good
switch (x) {
  case 1: handleOne(); break;
  default: handle();
}
```

### unicorn/no-useless-undefined

Disallow unnecessary `undefined`.

```js
// bad
function fn() { return undefined; }

// good
function fn() { return; }
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
const x = 0XFF;

// good
const x = 0xFF;
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
el.addEventListener('click', handler);
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
if (arr.filter((x) => x > 0).length > 0) {}

// good
if (arr.some((x) => x > 0)) {}
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
el.setAttribute('data-id', '123');

// good
el.dataset.id = '123';
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
el.innerText = 'hello';

// good
el.textContent = 'hello';
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
if (arr.indexOf(x) !== -1) {}

// good
if (arr.includes(x)) {}
```

### unicorn/prefer-json-parse-buffer

Prefer reading JSON from a Buffer.

```js
// bad
JSON.parse(fs.readFileSync(path, 'utf8'));

// good
JSON.parse(fs.readFileSync(path));
```

### unicorn/prefer-keyboard-event-key

Prefer `KeyboardEvent.key` over `keyCode`.

```js
// bad
if (event.keyCode === 13) {}

// good
if (event.key === 'Enter') {}
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
import fs from 'fs';

// good
import fs from 'node:fs';
```

### unicorn/prefer-number-properties

Prefer `Number` static properties over global ones.

```js
// bad
if (isNaN(x)) {}

// good
if (Number.isNaN(x)) {}
```

### unicorn/prefer-object-from-entries

Prefer `Object.fromEntries` over manual construction.

```js
// bad
const obj = {};
pairs.forEach(([k, v]) => { obj[k] = v; });

// good
const obj = Object.fromEntries(pairs);
```

### unicorn/prefer-optional-catch-binding

Prefer omitting the catch binding when unused.

```js
// bad
try {} catch (error) { handleGenericError(); }

// good
try {} catch { handleGenericError(); }
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
document.getElementById('app');

// good
document.querySelector('#app');
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
if ('hello'.match(/ell/)) {}

// good
if (/ell/.test('hello')) {}
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
const path = 'C:\\Users\\foo';

// good
const path = String.raw`C:\Users\foo`;
```

### unicorn/prefer-string-replace-all

Prefer `replaceAll` over `replace` with global regex.

```js
// bad
str.replace(/foo/g, 'bar');

// good
str.replaceAll('foo', 'bar');
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
if (str.indexOf('abc') === 0) {}

// good
if (str.startsWith('abc')) {}
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
if (x === 'a') {} else if (x === 'b') {} else if (x === 'c') {}

// good
switch (x) {
  case 'a': break;
  case 'b': break;
  case 'c': break;
}
```

### unicorn/prefer-ternary

Prefer ternary over simple `if-else` assignments.

```js
// bad
let x;
if (cond) { x = 'a'; } else { x = 'b'; }

// good
const x = cond ? 'a' : 'b';
```

### unicorn/prefer-top-level-await

Prefer top-level await over IIFEs.

```js
// bad
(async () => { await setup(); })();

// good
await setup();
```

### unicorn/prefer-type-error

Throw `TypeError` for type-checking conditions.

```js
// bad
if (typeof x !== 'string') throw new Error('Expected string');

// good
if (typeof x !== 'string') throw new TypeError('Expected string');
```

### unicorn/prevent-abbreviations

Enforce full words in identifiers.

```js
// bad
const btn = document.querySelector('button');

// good
const button = document.querySelector('button');
```

### unicorn/relative-url-style

Enforce consistent style for relative URL strings.

```js
// bad
new URL('./foo', base);

// good
new URL('foo', base);
```

### unicorn/require-array-join-separator

Require a separator argument in `Array.join()`.

```js
// bad
arr.join();

// good
arr.join(',');
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
window.postMessage(data, 'https://example.com');
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
new TextDecoder('UTF-8');

// good
new TextDecoder('utf-8');
```

### unicorn/throw-new-error

Require `new` when throwing errors.

```js
// bad
throw Error('fail');

// good
throw new Error('fail');
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
import foo from './no-default-export';

// good
import foo from './has-default-export';
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
import { foo } from 'mod';

// good
import { foo } from 'mod';
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
import { notExported } from './module';

// good
import { exported } from './module';
```

### import/namespace

Ensure namespace imports do not dereference non-existent properties.

```js
// bad
import * as mod from './module';
mod.notExported;

// good
import * as mod from './module';
mod.exported;
```

### import/no-absolute-path

Disallow importing with absolute file paths.

```js
// bad
import foo from '/Users/me/project/foo';

// good
import foo from './foo';
```

### import/no-amd

Disallow AMD `require` and `define` calls.

```js
// bad
define(['dep'], (dep) => {});

// good
import dep from 'dep';
```

### import/no-commonjs

Disallow CommonJS `require` calls and `module.exports`.

```js
// bad
const fs = require('fs');

// good
import fs from 'node:fs';
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
import { oldFunction } from 'lib'; // @deprecated

// good
import { newFunction } from 'lib';
```

### import/no-duplicates

Merge imports from the same module.

```js
// bad
import { a } from 'mod';
import { b } from 'mod';

// good
import { a, b } from 'mod';
```

### import/no-empty-named-blocks

Disallow empty named import blocks.

```js
// bad
import {} from 'mod';

// good
import { something } from 'mod';
```

### import/no-extraneous-dependencies

Disallow importing packages not listed in dependencies.

```js
// bad
import test from 'unlisted-package';

// good
import listed from 'listed-package';
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
import Foo from './foo'; // Foo is also a named export

// good
import { Foo } from './foo';
```

### import/no-named-as-default-member

Disallow accessing default export properties from a named import.

```js
// bad
import foo from './foo';
foo.bar; // bar is a named export

// good
import { bar } from './foo';
```

### import/no-named-default

Disallow named default exports.

```js
// bad
import { default as foo } from './foo';

// good
import foo from './foo';
```

### import/no-rename-default

Disallow renaming default imports.

```js
// bad
import { default as MyComponent } from './component';

// good
import MyComponent from './component';
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
import styles from 'style-loader!css!./styles.css';

// good
import styles from './styles.css';
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
<link rel="stylesheet" href="/styles.css" />

// good
import '/styles.css';
```

### nextjs/no-document-import-in-page

Disallow importing `next/document` outside `_document`.

```jsx
// bad
// In pages/index.js:
import Document from 'next/document';

// good
// In pages/_document.js:
import Document from 'next/document';
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
import Head from 'next/head';

// good
// In _document.js:
import { Head } from 'next/document';
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
<style jsx>{`p { color: red; }`}</style>

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
const p = new Promise((resolve) => { resolve(value); });

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
new Promise((resolve) => { resolve(1); });
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
app.get('/', (req, res) => {
  fetch(url).then((data) => res.json(data));
});

// good
app.get('/', async (req, res) => {
  const data = await fetch(url);
  res.json(data);
});
```

### promise/no-return-in-finally

Disallow return statements in `finally`.

```js
// bad
promise.finally(() => { return cleanup; });

// good
promise.finally(() => { cleanup(); });
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
readFile('file.txt', (err, data) => {});

// good
const data = await readFile('file.txt');
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
function fn() { arguments.map((x) => x); }

// good
function fn(...args) { args.map((x) => x); }
```

### oxc/bad-bitwise-operator

Flag potentially incorrect bitwise operators.

```js
// bad
if (x | 0 === 0) {}

// good
if ((x | 0) === 0) {}
```

### oxc/bad-char-at-comparison

Disallow incorrect `charAt` comparisons.

```js
// bad
if (str.charAt(0) === 'ab') {}

// good
if (str.charAt(0) === 'a') {}
```

### oxc/bad-comparison-sequence

Disallow comparison chains that do not work as intended.

```js
// bad
if (a < b < c) {}

// good
if (a < b && b < c) {}
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
if (x === {}) {}

// good
if (Object.keys(x).length === 0) {}
```

### oxc/bad-replace-all-arg

Disallow incorrect arguments to `replaceAll`.

```js
// bad
str.replaceAll(/foo/, 'bar');

// good
str.replaceAll(/foo/g, 'bar');
```

### oxc/const-comparisons

Disallow redundant comparisons involving constants.

```js
// bad
if (x >= 0 && x >= 1) {}

// good
if (x >= 1) {}
```

### oxc/double-comparisons

Simplify double comparisons.

```js
// bad
if (x === y || x < y) {}

// good
if (x <= y) {}
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
function fail() { new Error('fail'); }

// good
function fail() { throw new Error('fail'); }
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
for (const item of items) { result = [...result, item]; }

// good
const result = [];
for (const item of items) { result.push(item); }
```

### oxc/no-barrel-file

Disallow barrel files that re-export everything.

```js
// bad
export * from './a';
export * from './b';

// good
export { specific } from './a';
```

### oxc/number-arg-out-of-range

Disallow numeric arguments outside the allowed range.

```js
// bad
const x = Number.parseInt('ff', 37);

// good
const x = Number.parseInt('ff', 16);
```

### oxc/only-used-in-recursion

Flag parameters only used in recursive calls.

```js
// bad
function fn(a, b) { return fn(a, b - 1); }

// good
function fn(b) { return fn(b - 1); }
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

### node/handle-callback-err

Require error handling in callbacks.

```js
// bad
fs.readFile('f', (err, data) => { use(data); });

// good
fs.readFile('f', (err, data) => {
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
const app = new require('express')();

// good
const express = require('express');
const app = express();
```

### node/no-process-env

Disallow `process.env` usage directly; use a config module.

```js
// bad
const port = process.env.PORT;

// good
import { config } from './config';
const port = config.port;
```

### node/no-restricted-import

Disallow specified modules when loaded by `import`.

```js
// bad
import banned from 'banned-module';

// good
import allowed from 'allowed-module';
```

### node/prefer-global/text-decoder

Prefer the global `TextDecoder` over `require('util').TextDecoder`.

```js
// bad
const { TextDecoder } = require('util');

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

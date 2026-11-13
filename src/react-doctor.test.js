import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import reactDoctor from "oxlint-plugin-react-doctor";
import oxlintPackage from "oxlint/package.json" with { type: "json" };
import { describe, expect, it } from "vitest";

import { reasonsOf } from "../scripts/readme.mjs";

import config from "./index.ts";

const OXLINT = fileURLToPath(
  new URL(oxlintPackage.bin.oxlint, import.meta.resolve("oxlint/package.json")),
);

const listed = execFileSync(process.execPath, [OXLINT, "--rules", "--format=json"], {
  cwd: tmpdir(),
  encoding: "utf8",
});

const nativeRules = new Set(JSON.parse(listed).map(({ value }) => value));

// No fleet repo depends on these, as of 2026-11.
const UNUSED_LIBRARIES = new Set([
  "mobx",
  "preact",
  "pure-preact",
  "r3f",
  "radix-ui",
  "react-aria",
  "react-router",
  "remotion",
  "styled-components",
  "tanstack-virtual",
  "three",
  "valtio",
]);

const LEFT_OUT_WHEN = {
  "no fleet repo uses a library it requires": ({ requires = [] }) =>
    requires.some((library) => UNUSED_LIBRARIES.has(library.split(":")[0])),
  "oxlint has a native rule of the same name": ({ id }) => nativeRules.has(id),
  "upstream retired it": ({ lifecycle }) => lifecycle === "retired",
  "upstream ships it off": ({ defaultEnabled }) => defaultEnabled === false,
};

const NATIVE_NEXTJS = "the native nextjs plugin has the same check under another name";
const SERVER_CODE = "also fires on server code in a monorepo that ships a React Native app";
const NO_FIREBASE = "no fleet repo uses Firebase";
const NO_SUPABASE = "no fleet repo uses Supabase";
const NO_HITS = "fired nowhere in the fleet when it was tried in #88";
const NO_REASON = "no reason was recorded";

const LEFT_OUT = {
  "duplicate-jsx-subtree": NO_REASON,
  "expo-no-non-inlined-env": SERVER_CODE,
  "firebase-client-owned-authz-field": NO_FIREBASE,
  "firebase-permissive-rules": NO_FIREBASE,
  "nextjs-async-client-component": NATIVE_NEXTJS,
  "nextjs-inline-script-missing-id": NATIVE_NEXTJS,
  "nextjs-no-css-link": NATIVE_NEXTJS,
  "nextjs-no-google-analytics-script": NATIVE_NEXTJS,
  "nextjs-no-polyfill-script": NATIVE_NEXTJS,
  "no-array-index-as-key": "ports `react/no-array-index-key`, which this config turns off",
  "no-default-props": NO_HITS,
  "no-high-complexity-react-function": NO_REASON,
  "no-ref-callback-cleanup-before-react-19": "for React 18, and the fleet is on React 19",
  "prefer-html-dialog": NO_HITS,
  "rn-no-dimensions-get": SERVER_CODE,
  "rn-prefer-pressable-over-gesture-detector":
    "flags the `GestureDetector` tap that `rn-pressable-shared-value-mutation` asks for",
  "supabase-client-owned-authz-field": NO_SUPABASE,
  "supabase-rls-policy-risk": NO_SUPABASE,
  "supabase-table-missing-rls": NO_SUPABASE,
  "webgl-no-sync-readback-in-animation-loop": "WebGL, like the three and r3f rules",
};

const PREFIX = "react-doctor/";

const settings = new Map(
  Object.entries(config.rules)
    .filter(([name]) => name.startsWith(PREFIX))
    .map(([name, setting]) => [name.slice(PREFIX.length), setting]),
);

const reasons = reasonsOf(readFileSync(new URL("index.ts", import.meta.url), "utf8")).rules;

const leftOutByRule = (rule) => Object.values(LEFT_OUT_WHEN).some((applies) => applies(rule));

const problemWith = (rule) => {
  const setting = settings.get(rule.id);

  if (setting === undefined) {
    return leftOutByRule(rule) || rule.id in LEFT_OUT
      ? []
      : [`${rule.id} is new upstream: enable it as "${rule.severity}", or add it to LEFT_OUT.`];
  }

  if (rule.lifecycle === "retired") {
    return [`${rule.id} is retired upstream: remove it.`];
  }

  return setting === rule.severity || reasons.get(`${PREFIX}${rule.id}`)
    ? []
    : [
        `${rule.id} is ${JSON.stringify(setting)} here and "${rule.severity}" upstream: align it, or put the reason in a comment above it.`,
      ];
};

describe("the react-doctor selection", () => {
  it("accounts for every rule the installed plugin exports", () => {
    expect(Object.values(reactDoctor.rules).flatMap(problemWith)).toEqual([]);
  });

  it("leaves out by name only rules that need it", () => {
    const stale = Object.keys(LEFT_OUT).filter((id) => {
      const rule = reactDoctor.rules[id];

      return rule === undefined || settings.has(id) || leftOutByRule(rule);
    });

    expect(stale).toEqual([]);
  });
});

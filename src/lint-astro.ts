#!/usr/bin/env node
import "./typescript6.js";

import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ESLint } from "eslint";
import type { OxlintConfig } from "oxlint";

const isObject = (value: unknown): value is object => typeof value === "object" && value !== null;

const hasDefaultConfig = (loaded: unknown): loaded is { default: OxlintConfig } =>
  isObject(loaded) && "default" in loaded && isObject(loaded.default);

const { default: astro } = await import("./astro.js");
const loaded: unknown = await import(pathToFileURL(resolve("oxlint.config.ts")).href);

if (!hasDefaultConfig(loaded)) {
  throw new TypeError("oxlint.config.ts must default-export the repo's oxlint config.");
}

const tracked = await new Promise<string>((done, fail) => {
  execFile("git", ["ls-files", "-z", "--", "*.astro"], (error, stdout) => {
    if (error) {
      fail(new Error("git ls-files failed, so no template was linted.", { cause: error }));

      return;
    }

    done(stdout);
  });
});

const eslint = new ESLint({
  errorOnUnmatchedPattern: false,
  overrideConfig: astro(loaded.default),
  overrideConfigFile: true,
  passOnNoPatterns: true,
});

const results = await eslint.lintFiles(tracked.split("\0").filter(Boolean));
const formatter = await eslint.loadFormatter("stylish");

process.stdout.write(await formatter.format(results));

if (results.some(({ errorCount, warningCount }) => errorCount + warningCount > 0)) {
  process.exitCode = 1;
}

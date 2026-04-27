#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const HELP = `Usage: npx oxlint-config-awesomeness init [--force]

Scaffold oxlint.config.ts in the current directory.
  -f, --force  Overwrite an existing oxlint.config.ts
  -h, --help   Show this help
`;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    force: { short: "f", type: "boolean" },
    help: { short: "h", type: "boolean" },
  },
});

const command = positionals[0];

if (values.help || !command) {
  process.stdout.write(HELP);
  process.exit(0);
}

if (command !== "init") {
  process.stderr.write(`Unknown command: ${command}\n\n${HELP}`);
  process.exit(1);
}

const target = resolve("oxlint.config.ts");

if (existsSync(target) && !values.force) {
  process.stderr.write(
    "oxlint.config.ts already exists. Re-run with --force.\n",
  );
  process.exit(1);
}

copyFileSync(resolve(import.meta.dirname, "template.ts"), target);
process.stdout.write(`Created ${target}\nNext: npx oxlint\n`);

#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TEMPLATE = `import awesomeness from "oxlint-config-awesomeness";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [awesomeness],
});
`;

const NEXT_STEPS = `
Next steps:
  1. Install peer plugins (skip any you already have):
       npm install -D eslint-plugin-no-only-tests eslint-plugin-perfectionist eslint-plugin-react-hooks eslint-plugin-unused-imports
  2. Run oxlint:
       npx oxlint
`;

const USAGE = `Usage: npx oxlint-config-awesomeness <command> [options]

Commands:
  init             Scaffold oxlint.config.ts in the current directory.

Options:
  --force          Overwrite an existing oxlint.config.{ts,js}.
`;

const command = process.argv[2];
const force = process.argv.includes("--force");

if (command !== "init") {
  process.stdout.write(USAGE);
  process.exit(command ? 1 : 0);
}

const cwd = process.cwd();
const target = resolve(cwd, "oxlint.config.ts");
const conflict = existsSync(target) || existsSync(resolve(cwd, "oxlint.config.js"));

if (conflict && !force) {
  process.stderr.write(
    "Refusing to overwrite existing oxlint.config.{ts,js}. Re-run with --force to replace.\n",
  );
  process.exit(1);
}

writeFileSync(target, TEMPLATE);
process.stdout.write(`Created ${target}\n`);
process.stdout.write(NEXT_STEPS);

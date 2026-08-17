#!/usr/bin/env node
import { constants, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const HELP = `Usage: npx oxlint-config-awesomeness init [--force]

Scaffold oxlint.config.ts in the current directory.
  -f, --force  Overwrite an existing oxlint.config.ts
  -h, --help   Show this help
`;

const fail = (message) => {
  process.stderr.write(`${message}\n\n${HELP}`);
  process.exit(1);
};

const parseCliArgs = () => {
  try {
    return parseArgs({
      allowPositionals: true,
      options: {
        force: { short: "f", type: "boolean" },
        help: { short: "h", type: "boolean" },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(message);
  }
};

const { positionals, values } = parseCliArgs();

if (values.help || positionals.length === 0) {
  process.stdout.write(HELP);
  process.exit(0);
}

if (positionals.length > 1 || positionals[0] !== "init") {
  fail(`Unknown command: ${positionals.join(" ")}`);
}

const target = resolve("oxlint.config.ts");

try {
  copyFileSync(
    resolve(import.meta.dirname, "template.ts"),
    target,
    values.force ? 0 : constants.COPYFILE_EXCL,
  );
} catch (error) {
  if (error instanceof Error && "code" in error && error.code === "EEXIST") {
    process.stderr.write(
      "oxlint.config.ts already exists. Re-run with --force.\n",
    );
  } else {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Failed to create ${target}: ${message}\n`);
  }
  process.exit(1);
}

process.stdout.write(`Created ${target}\nNext: npx oxlint\n`);

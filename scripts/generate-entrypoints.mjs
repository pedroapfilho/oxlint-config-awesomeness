import { readFile, writeFile } from "node:fs/promises";

import { format } from "oxfmt";

const FORMAT_CONFIG_PATH = new URL("../.oxfmtrc.json", import.meta.url);
const CHECK_ONLY = process.argv.includes("--check");
const GENERATED_FILES = [
  {
    formatName: "generated.js",
    origin: "src/index.ts",
    source: new URL("../dist/index.js", import.meta.url),
    target: new URL("../index.js", import.meta.url),
  },
  {
    formatName: "generated.js",
    origin: "src/awesomeness.ts",
    source: new URL("../dist/awesomeness.js", import.meta.url),
    target: new URL("../awesomeness/index.js", import.meta.url),
  },
  {
    formatName: "generated.js",
    origin: "src/init.ts",
    source: new URL("../dist/init.js", import.meta.url),
    target: new URL("../bin/init.js", import.meta.url),
  },
  {
    formatName: "generated.d.ts",
    origin: "src/index.ts",
    source: new URL("../dist/index.d.ts", import.meta.url),
    target: new URL("../index.d.ts", import.meta.url),
  },
];

const bannerFor = (origin) =>
  `// @generated from ${origin} — do not edit. Regenerate with \`pnpm build\`.\n`;

const withBanner = (emitted, origin) =>
  emitted.startsWith("#!")
    ? emitted.replace(/^(?<shebang>#![^\n]*\n)/v, `$<shebang>${bannerFor(origin)}`)
    : bannerFor(origin) + emitted;

const formatGeneratedFile = async ({ formatName, origin, source, target }, options) => {
  const emitted = withBanner(await readFile(source, "utf8"), origin);
  const input = emitted.replace(
    /(?<importStatement>import[^\n]+;\n)(?=(?:const|declare)\b)/v,
    "$<importStatement>\n",
  );
  const result = await format(formatName, input, options);

  if (result.errors.length > 0) {
    throw new Error(result.errors.map(({ message }) => message).join("\n"));
  }

  if (CHECK_ONLY) {
    const current = await readFile(target, "utf8");

    if (current !== result.code) {
      throw new Error(`${target.pathname} is stale`);
    }

    return;
  }

  await writeFile(target, result.code);
};

const formatConfig = JSON.parse(await readFile(FORMAT_CONFIG_PATH, "utf8"));
delete formatConfig.$schema;
delete formatConfig.ignorePatterns;

const results = await Promise.allSettled(
  GENERATED_FILES.map((file) => formatGeneratedFile(file, formatConfig)),
);
const failures = results.filter(({ status }) => status === "rejected");

if (failures.length > 0) {
  throw new AggregateError(
    failures.map(({ reason }) => reason),
    "Failed to generate package entrypoints",
  );
}

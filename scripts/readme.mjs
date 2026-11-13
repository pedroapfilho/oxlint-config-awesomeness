import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "@typescript/typescript6";
import oxlintPackage from "oxlint/package.json" with { type: "json" };

const OXLINT = fileURLToPath(
  new URL(oxlintPackage.bin.oxlint, import.meta.resolve("oxlint/package.json")),
);

const SEVERITY = { allow: "off", deny: "error", error: "error", off: "off", warn: "warn" };

// Run outside the repo: oxlint loads the nearest config, and this one imports the built package.
const oxlint = (args, cwd) =>
  JSON.parse(execFileSync(process.execPath, [OXLINT, ...args], { cwd, encoding: "utf8" }));

const printConfig = (config) => {
  const directory = mkdtempSync(join(tmpdir(), "readme-"));

  try {
    writeFileSync(
      join(directory, "oxlint.config.mjs"),
      `export default ${JSON.stringify(config)};`,
    );

    return oxlint(["-c", "oxlint.config.mjs", "--print-config"], directory);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
};

const severityOf = (setting) => SEVERITY[Array.isArray(setting) ? setting[0] : setting];

const prefixOf = (name) => name.slice(0, Math.max(name.lastIndexOf("/"), 0));

const code = (text) => `\`${text}\``;

const literalOf = (node) => (ts.isAsExpression(node) ? node.expression : node);

// The comment directly above each rule and each override is its reason. A
// comment followed by a blank line is a heading for the source alone.
const reasonsOf = (text) => {
  const file = ts.createSourceFile("index.ts", text, ts.ScriptTarget.Latest, true);
  const families = new Map();

  const reasonAbove = (node) => {
    const lines = [];
    let below = node.getStart(file);

    for (const { end, pos } of (
      ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []
    ).toReversed()) {
      if (text.slice(end, below).split("\n").length > 2) {
        break;
      }

      lines.unshift(text.slice(pos + 2, end).trim());
      below = pos;
    }

    return lines.filter(Boolean).join(" ");
  };

  const reasonsIn = (object) =>
    new Map(
      object.properties.flatMap((property) =>
        ts.isSpreadAssignment(property)
          ? [...(families.get(property.expression.getText(file)) ?? [])]
          : [[property.name.text, reasonAbove(property)]],
      ),
    );

  const valueOf = (object, key) =>
    object.properties.find((property) => property.name?.getText(file) === key).initializer;

  let config;

  for (const { initializer, name } of file.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => statement.declarationList.declarations)) {
    const value = literalOf(initializer);

    if (ts.isObjectLiteralExpression(value)) {
      families.set(name.getText(file), reasonsIn(value));
    } else if (ts.isCallExpression(value) && value.expression.getText(file) === "defineConfig") {
      [config] = value.arguments;
    }
  }

  return {
    overrides: valueOf(config, "overrides").elements.map((override) => ({
      reason: reasonAbove(override),
      rules: reasonsIn(valueOf(override, "rules")),
    })),
    rules: reasonsIn(valueOf(config, "rules")),
  };
};

const headingsIn = (readme) =>
  [...readme.matchAll(/^### (?<name>\S+)$/gmv)].map(({ groups }) => groups.name);

// oxlint is the one model of what a rule name means and of what a category
// enables. Its `--print-config` reports both.
const modelOf = ({ config, readme, source }) => {
  const jsPlugins = new Set(config.jsPlugins.map(({ name }) => name));
  const isNative = (name) => !jsPlugins.has(prefixOf(name));

  const rootRules = (native) =>
    Object.fromEntries(Object.entries(config.rules).filter(([name]) => isNative(name) === native));

  const plugins = [
    ...config.plugins,
    ...config.overrides.flatMap((override) => override.plugins ?? []),
  ];

  const written = [
    ...Object.keys(config.rules),
    ...config.overrides.flatMap(({ rules }) => Object.keys(rules)),
    ...headingsIn(readme),
  ];

  const natives = [...new Set(written.filter(isNative))];

  const probe = printConfig({
    overrides: natives.map((name) => ({ files: ["x"], rules: { [name]: "off" } })),
    plugins,
  });

  const canonical = new Map(
    natives.map((name, position) => [name, Object.keys(probe.overrides[position].rules)[0]]),
  );

  const keyOf = (name) => canonical.get(name) ?? name;

  const settingsOf = (rules) =>
    new Map(Object.entries(rules).map(([name, setting]) => [keyOf(name), severityOf(setting)]));

  const resolve = (added = []) =>
    printConfig({
      categories: config.categories,
      options: config.options,
      overrides: config.overrides.map(({ files, rules }) => ({ files, rules })),
      plugins: [...config.plugins, ...added],
      rules: rootRules(true),
    });

  const printed = resolve();

  const rootSettings = (resolved) =>
    new Map([...settingsOf(resolved.rules), ...settingsOf(rootRules(false))]);

  const keyed = (reasons) => new Map([...reasons].map(([name, reason]) => [keyOf(name), reason]));
  const sourceReasons = reasonsOf(source);

  const reasons = {
    overrides: sourceReasons.overrides.map(({ reason, rules }) => ({
      reason,
      rules: keyed(rules),
    })),
    rules: keyed(sourceReasons.rules),
  };

  const scopes = [
    { reasons: reasons.rules, settings: rootSettings(printed) },
    ...config.overrides.map((override, position) => ({
      reasons: reasons.overrides[position].rules,
      settings: new Map([
        ...rootSettings(override.plugins === undefined ? printed : resolve(override.plugins)),
        ...settingsOf(printed.overrides[position].rules),
      ]),
    })),
  ];

  const running = new Map();

  for (const { reasons: scopeReasons, settings } of scopes) {
    for (const [key, severity] of settings) {
      if (severity !== "off" && !running.has(key)) {
        running.set(key, {
          reason: severity === "warn" ? (scopeReasons.get(key) ?? "") : "",
          severity,
        });
      }
    }
  }

  return {
    config,
    documentationOf: new Map(
      oxlint(["--rules", "--format=json"], tmpdir()).map(({ docs_url: url, scope, value }) => [
        scope === "eslint" ? value : `${scope}/${value}`,
        url,
      ]),
    ),
    jsPlugins,
    keyOf,
    plugins: ["eslint", ...plugins, ...jsPlugins],
    reasons,
    running,
  };
};

const renderSummary = ({ config, plugins }) => {
  const named = Object.values(config.rules).filter((setting) => severityOf(setting) !== "off");

  return `All five oxlint rule categories at \`error\`, plus **${named.length} rules** enabled by name, across **${plugins.length} plugins**.`;
};

const renderTemplate = ({ template }) => `\`\`\`ts\n${template}\`\`\``;

const renderPlugins = ({ jsPlugins, plugins }, body) => {
  const described = new Map(
    [...body.matchAll(/^- \*\*(?<name>[^*]+)\*\*(?: \(JS plugin\))?: (?<description>.+)$/gmv)].map(
      ({ groups }) => [groups.name, groups.description],
    ),
  );

  return plugins
    .map((name) =>
      `- **${name}**${jsPlugins.has(name) ? " (JS plugin)" : ""}: ${described.get(name) ?? ""}`.trim(),
    )
    .join("\n");
};

const settingText = (setting) => (setting === "off" ? "off" : code(JSON.stringify(setting)));

const renderOverrides = ({ config, keyOf, reasons }) =>
  config.overrides
    .map(({ files, plugins = [], rules }, position) => {
      const { reason, rules: reasonOf } = reasons.overrides[position];

      if (reason === "") {
        throw new Error(`The ${files[0]} override has no reason comment above it in src/index.ts.`);
      }

      const explained = ([name]) => Boolean(reasonOf.get(keyOf(name)));
      const entries = Object.entries(rules);
      const also = entries.some(explained) ? "Also " : "Set to ";

      return [
        `- ${files.map(code).join(", ")}: ${reason}${plugins.map((plugin) => ` Adds the ${code(plugin)} plugin.`).join("")}`,
        ...entries
          .filter(explained)
          .map(
            ([name, setting]) =>
              `  - ${code(name)} is ${settingText(setting)}: ${reasonOf.get(keyOf(name))}`,
          ),
        ...Map.groupBy(
          entries.filter((entry) => !explained(entry)),
          ([, setting]) => settingText(setting),
        )
          .entries()
          .map(
            ([setting, group]) =>
              `  - ${also}${setting}: ${group.map(([name]) => code(name)).join(", ")}.`,
          ),
      ].join("\n");
    })
    .join("\n");

const renderDisabled = ({ config, keyOf, reasons }) =>
  Object.entries(config.rules)
    .filter(([, setting]) => severityOf(setting) === "off")
    .map(([name]) => {
      const reason = reasons.rules.get(keyOf(name));

      if (!reason) {
        throw new Error(`${name} is off with no reason comment above it in src/index.ts.`);
      }

      return `- ${code(name)}: ${reason}`;
    })
    .join("\n");

const SEVERITY_NOTE = /(?:^| )Severity: `(?:error|warn)`.*$/v;

const renderSection = ({ body, name }, { reason, severity }) => {
  const [description, ...example] = body.split("\n");

  return [
    `### ${name}\n`,
    [description.replace(SEVERITY_NOTE, ""), `Severity: ${code(severity)}.`, reason]
      .filter(Boolean)
      .join(" "),
    ...example,
  ].join("\n");
};

const parseGroups = (body) =>
  body.split(/\n(?=## )/v).map((group) => {
    const [heading, ...sections] = group.split(/\n(?=### )/v);

    return {
      heading: heading.trim(),
      sections: sections.map((section) => ({
        body: section.slice(section.indexOf("\n")).trim(),
        name: section.slice(4, section.indexOf("\n")),
      })),
    };
  });

const renderRules = ({ documentationOf, keyOf, running }, body) => {
  const documented = new Set();

  const groups = parseGroups(body).map(({ heading, sections }) => ({
    heading,
    sections: sections
      .map((section) => ({ ...section, key: keyOf(section.name) }))
      .filter(({ key }) => {
        const fresh = running.has(key) && !documented.has(key);
        documented.add(key);

        return fresh;
      }),
  }));

  // An undocumented rule joins the group that holds most of its plugin's rules, under their prefix.
  for (const key of running.keys().filter((rule) => !documented.has(rule))) {
    const siblings = ({ sections }) =>
      sections.filter((section) => prefixOf(section.key) === prefixOf(key));

    const [home] = groups
      .filter((group) => siblings(group).length > 0)
      .toSorted((a, b) => siblings(b).length - siblings(a).length);

    const url = documentationOf.get(key);
    const prefix = prefixOf(home === undefined ? key : siblings(home)[0].name);
    const rule = key.slice(key.lastIndexOf("/") + 1);

    const section = {
      body: url === undefined ? "" : `[oxlint documentation](${url}).`,
      key,
      name: prefix === "" ? rule : `${prefix}/${rule}`,
    };

    if (home === undefined) {
      groups.push({ heading: `## ${prefixOf(key)} Rules`, sections: [section] });
    } else {
      home.sections.push(section);
    }
  }

  return groups
    .filter(({ heading, sections }) => sections.length > 0 || heading.includes("\n"))
    .map(({ heading, sections }) =>
      [
        heading,
        ...sections
          .toSorted((a, b) => (a.name < b.name ? -1 : 1))
          .map((section) => renderSection(section, running.get(section.key))),
      ].join("\n\n"),
    )
    .join("\n\n");
};

const REGIONS = {
  disabled: renderDisabled,
  overrides: renderOverrides,
  plugins: renderPlugins,
  rules: renderRules,
  summary: renderSummary,
  template: renderTemplate,
};

export const generate = ({ config, readme, source, template }) => {
  const missing = Object.keys(REGIONS).filter((name) => !readme.includes(`<!-- ${name}:start -->`));

  if (missing.length > 0) {
    throw new Error(`README.md has no ${missing.join(", ")} region.`);
  }

  const model = { ...modelOf({ config, readme, source }), template };

  return readme.replaceAll(
    /<!-- (?<name>[a-z]+):start -->\n(?<body>[\s\S]*?)<!-- \k<name>:end -->/gv,
    (...match) => {
      const { body, name } = match.at(-1);

      return `<!-- ${name}:start -->\n\n${REGIONS[name](model, body.trim())}\n\n<!-- ${name}:end -->`;
    },
  );
};

if (import.meta.main) {
  const path = new URL("../README.md", import.meta.url);
  const readme = readFileSync(path, "utf8");

  const { default: config } = await import("../src/index.ts");

  const generated = generate({
    config,
    readme,
    source: readFileSync(new URL("../src/index.ts", import.meta.url), "utf8"),
    template: readFileSync(new URL("../bin/template.ts", import.meta.url), "utf8"),
  });

  if (generated !== readme && process.argv.includes("--check")) {
    process.stderr.write("README.md is stale. Run `pnpm readme` and commit the result.\n");
    process.exitCode = 1;
  } else if (generated !== readme) {
    writeFileSync(path, generated);
  }
}

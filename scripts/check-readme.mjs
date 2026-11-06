import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import oxlintPackage from "oxlint/package.json" with { type: "json" };

const PLUGIN_OF_PREFIX = { "@typescript-eslint": "typescript", "react-hooks": "react" };
const PLUGIN_OF_SCOPE = { jsx_a11y: "jsx-a11y", react_perf: "react-perf" };

// Run outside the repo: oxlint loads the nearest config, and this one imports the built package.
const listOxlintRules = () => {
  const oxlint = fileURLToPath(
    new URL(oxlintPackage.bin.oxlint, import.meta.resolve("oxlint/package.json")),
  );

  return JSON.parse(
    execFileSync(process.execPath, [oxlint, "--rules", "--format=json"], {
      cwd: tmpdir(),
      encoding: "utf8",
    }),
  );
};

const severityOf = (setting) => (Array.isArray(setting) ? setting[0] : setting);

const isOn = (severity) => severity !== undefined && severity !== "off";

const sectionOf = (readme, heading) =>
  readme.split(/\n(?=## )/v).find((part) => part.startsWith(`## ${heading}\n`)) ?? "";

const tableRows = (readme, heading) =>
  sectionOf(readme, heading)
    .split("\n")
    .filter((line) => line.startsWith("| ") && !line.startsWith("| -"))
    .slice(1)
    .map((line) => line.split("|").slice(1, -1));

const codeSpans = (text) =>
  [...text.matchAll(/`(?<span>[^`]+)`/gv)].map(({ groups }) => groups.span);

// What the config runs, with every rule keyed `plugin/rule` the way oxlint lists it.
const modelOf = (config, listedRules) => {
  const nativeRules = new Map(
    listedRules.map((rule) => [`${PLUGIN_OF_SCOPE[rule.scope] ?? rule.scope}/${rule.value}`, rule]),
  );

  // Like oxlint, a bare name means the core rule, or else the one plugin rule of that name.
  const bareRuleKey = (name) => {
    const owners = [...nativeRules.keys()].filter((key) => key.endsWith(`/${name}`));

    return nativeRules.has(`eslint/${name}`) || owners.length !== 1 ? `eslint/${name}` : owners[0];
  };

  const ruleKey = (name) => {
    const slash = name.indexOf("/");

    if (slash === -1) {
      return bareRuleKey(name);
    }

    const prefix = name.slice(0, slash);

    return `${PLUGIN_OF_PREFIX[prefix] ?? prefix}/${name.slice(slash + 1)}`;
  };

  const severities = (rules = {}) =>
    new Map(Object.entries(rules).map(([name, setting]) => [ruleKey(name), severityOf(setting)]));

  const rootSeverities = severities(config.rules);
  const rootPlugins = ["eslint", ...config.plugins, ...config.jsPlugins.map(({ name }) => name)];

  const scopes = [
    { plugins: new Set(rootPlugins), severities: rootSeverities },
    ...config.overrides.map((override) => ({
      plugins: new Set([...rootPlugins, ...(override.plugins ?? [])]),
      severities: new Map([...rootSeverities, ...severities(override.rules)]),
    })),
  ];

  const onByCategory = (key) => {
    const rule = nativeRules.get(key);

    return (
      rule !== undefined &&
      isOn(config.categories[rule.category]) &&
      (rule.type_aware === false || config.options.typeAware === true)
    );
  };

  const runsIn = (scope, key) =>
    scope.plugins.has(key.slice(0, key.indexOf("/"))) &&
    (scope.severities.has(key) ? isOn(scope.severities.get(key)) : onByCategory(key));

  const runs = (key) => scopes.some((scope) => runsIn(scope, key));

  const allRules = new Set([
    ...nativeRules.keys(),
    ...rootSeverities.keys(),
    ...config.overrides.flatMap(({ rules = {} }) => Object.keys(rules)).map(ruleKey),
  ]);

  return {
    config,
    plugins: new Set([...rootPlugins, ...config.overrides.flatMap(({ plugins = [] }) => plugins)]),
    rootSeverities,
    ruleKey,
    ruleNamesIn: (text) => codeSpans(text).filter((span) => allRules.has(ruleKey(span))),
    runs,
    severities,
  };
};

const checkHeadline = ({ config, plugins }, readme) => {
  const named = Object.values(config.rules).filter((setting) => isOn(severityOf(setting))).length;

  const headline =
    /\*\*(?<rules>\d+) rules\*\* enabled by name, across \*\*(?<plugins>\d+) plugins\*\*/v.exec(
      readme,
    )?.groups;

  return Number(headline?.rules) === named && Number(headline?.plugins) === plugins.size
    ? []
    : [
        `README headline should read **${named} rules** enabled by name, across **${plugins.size} plugins**.`,
      ];
};

const checkPlugins = ({ plugins }, readme) => {
  const documented = new Set([
    ...tableRows(readme, "Plugins").map(([name]) => name.trim().split(" ")[0]),
    ...[...sectionOf(readme, "Plugins").matchAll(/\*\*(?<name>[^*]+)\*\*/gv)].map(
      ({ groups }) => groups.name,
    ),
  ]);

  return plugins
    .union(documented)
    .values()
    .filter((plugin) => !plugins.has(plugin) || !documented.has(plugin))
    .map((plugin) => `README Plugins and the config disagree about ${plugin}.`)
    .toArray();
};

const checkUsage = (readme, template) =>
  readme.includes(`\`\`\`ts\n${template}\`\`\``)
    ? []
    : ["README Usage no longer shows bin/template.ts verbatim."];

const ruleSectionsOf = (readme) =>
  readme
    .slice(readme.indexOf("\n## All Rules\n"))
    .split(/\n(?=### )/v)
    .map(
      (section) =>
        /^### (?<name>\S+)\n[\s\S]*?(?:Severity: `(?<severity>error|warn)`|$)/v.exec(section)
          ?.groups,
    )
    .filter((section) => section !== undefined);

const checkRuleSections = ({ rootSeverities, ruleKey, runs }, sections) =>
  sections.flatMap(({ name, severity }) => {
    const configured = rootSeverities.get(ruleKey(name));

    if (!runs(ruleKey(name))) {
      return [`README documents ${name}, which this config does not run.`];
    }

    return severity === undefined || configured === severity
      ? []
      : [`${name} is documented as ${severity}; configured as ${configured ?? "unset"}.`];
  });

const checkNamedRules = ({ config, rootSeverities, ruleKey, ruleNamesIn }, readme, sections) => {
  const documented = new Map(sections.map(({ name, severity }) => [ruleKey(name), severity]));

  const disabled = new Set(
    tableRows(readme, "Disabled by Intent")
      .flatMap((cells) => ruleNamesIn(cells.join("|")))
      .map(ruleKey),
  );

  const notOff = disabled
    .values()
    .filter((key) => rootSeverities.get(key) !== "off")
    .map((key) => `README lists ${key} as disabled; the config does not turn it off.`)
    .toArray();

  const undocumented = Object.entries(config.rules).flatMap(([name, setting]) => {
    const key = ruleKey(name);
    const severity = severityOf(setting);

    if (severity === "off") {
      return disabled.has(key)
        ? []
        : [`${name} is off but missing from README Disabled by Intent.`];
    }

    if (!documented.has(key)) {
      return [`${name} is enabled but has no README section.`];
    }

    return severity === "warn" && documented.get(key) !== "warn"
      ? [`${name} warns, but its README section does not say Severity: \`warn\`.`]
      : [];
  });

  return [...notOff, ...undocumented];
};

const checkOverrideRow = ({ config, ruleKey, ruleNamesIn, severities }, { changes, globs }) => {
  const override = config.overrides.find(({ files }) => files.includes(globs[0]));

  if (override === undefined || globs.some((glob) => !override.files.includes(glob))) {
    return [`README override row ${globs.join(", ")} does not match one override.`];
  }

  const changed = severities(override.rules);

  return ruleNamesIn(changes)
    .filter((name) => !changed.has(ruleKey(name)))
    .map((name) => `README says the ${globs[0]} override changes ${name}; it does not.`);
};

const checkOverrides = (model, readme) => {
  const rows = tableRows(readme, "File-Type Overrides").map(([files = "", ...changes]) => ({
    changes: changes.join("|"),
    globs: codeSpans(files),
  }));

  const missing = model.config.overrides
    .filter(({ files }) => !rows.some(({ globs }) => files.includes(globs[0])))
    .map(({ files }) => `The ${files[0]} override is missing from README File-Type Overrides.`);

  return [...rows.flatMap((row) => checkOverrideRow(model, row)), ...missing];
};

export const checkReadme = ({ config, readme, rules, template }) => {
  const model = modelOf(config, rules);
  const sections = ruleSectionsOf(readme);

  return [
    ...checkHeadline(model, readme),
    ...checkPlugins(model, readme),
    ...checkUsage(readme, template),
    ...checkRuleSections(model, sections),
    ...checkNamedRules(model, readme, sections),
    ...checkOverrides(model, readme),
  ];
};

if (import.meta.main) {
  const { default: config } = await import("../src/index.ts");

  const failures = checkReadme({
    config,
    readme: readFileSync(new URL("../README.md", import.meta.url), "utf8"),
    rules: listOxlintRules(),
    template: readFileSync(new URL("../bin/template.ts", import.meta.url), "utf8"),
  });

  if (failures.length > 0) {
    process.stderr.write(`${failures.join("\n")}\n`);
    process.exitCode = 1;
  }
}

import { readFileSync } from "node:fs";

import config from "../index.js";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

const severityOf = (setting) => (Array.isArray(setting) ? setting[0] : setting);

const configuredSeverities = new Map(
  Object.entries(config.rules).map(([ruleName, setting]) => [ruleName, severityOf(setting)]),
);

const enabledRules = [...configuredSeverities]
  .filter(([, severity]) => severity !== "off")
  .map(([ruleName]) => ruleName);

const failures = [];
const headlineCount = /\*\*(?<ruleCount>\d+) rules\*\*/v.exec(readme)?.groups?.ruleCount;

if (Number(headlineCount) !== enabledRules.length) {
  failures.push(
    `README rule count is ${headlineCount ?? "missing"}; expected ${enabledRules.length}.`,
  );
}

for (const section of readme.split(/\n(?=### )/v)) {
  const claim = /^### (?<ruleName>[^\n]+)\n[\s\S]*?Severity: `(?<severity>error|warn|off)`\./v.exec(
    section,
  );

  if (claim?.groups === undefined) {
    continue;
  }

  const { ruleName, severity: documentedSeverity } = claim.groups;
  const configuredSeverity = configuredSeverities.get(ruleName);

  if (configuredSeverity === undefined) {
    failures.push(`${ruleName} has a README severity but is not configured.`);
  } else if (configuredSeverity !== documentedSeverity) {
    failures.push(
      `${ruleName} is documented as ${documentedSeverity}; configured as ${configuredSeverity}.`,
    );
  }
}

for (const ruleName of enabledRules) {
  const documentedRuleName = ruleName.replace(/^eslint\//v, "");

  if (!readme.includes(documentedRuleName)) {
    failures.push(`${ruleName} is enabled but missing from README.`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
}

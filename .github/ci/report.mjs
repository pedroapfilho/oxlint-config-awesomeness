/* oxlint-disable node/no-sync -- This short-lived CLI reads bounded Git metadata before starting asynchronous project tasks. */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

export const report = (root, name, data) => {
  const directory = join(root, ".ci-results");
  mkdirSync(directory, { recursive: true });
  const filename = name.replaceAll(/[^a-zA-Z0-9_-]/g, "-");
  writeFileSync(join(directory, `${filename}.json`), `${JSON.stringify(data, null, 2)}\n`);
};

export const reportPlan = (root, plan, env = process.env) => {
  report(root, `plan-${plan.kind}`, plan);
  if (env.GITHUB_OUTPUT)
    appendFileSync(env.GITHUB_OUTPUT, `run=${plan.run}\nscope=${plan.scope}\n`);
  if (env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      env.GITHUB_STEP_SUMMARY,
      `### CI selection: ${plan.kind}\n\nMode: **${plan.mode}**. Proposed scope: **${plan.scope}**.\n\n` +
        `${plan.reason}\n\nChanged paths: ${plan.paths.length}. Affected packages: ${plan.packages.length}.\n\n` +
        `Tested revision: \`${plan.head || "unknown"}\`.\n\n`,
    );
};

export const turboSummaries = (root, since) => {
  const directory = join(root, ".turbo/runs");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
      const summary = JSON.parse(readFileSync(join(directory, file), "utf8"));
      if ((summary.execution?.startTime || 0) < since) return [];
      return [
        {
          id: summary.id,
          execution: summary.execution,
          tasks: summary.tasks?.map((task) => ({
            task: task.taskId,
            cache: task.cache,
            execution: task.execution,
          })),
        },
      ];
    });
};

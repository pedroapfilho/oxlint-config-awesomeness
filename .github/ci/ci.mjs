/* oxlint-disable node/no-sync -- This short-lived CLI reads bounded Git metadata before starting asynchronous project tasks. */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createPlan } from "./plan.mjs";
import { report, reportPlan, turboSummaries } from "./report.mjs";

const root = process.cwd();
const [action, kind, ...rest] = process.argv.slice(2);

const run = async () => {
  if (!["plan", "run"].includes(action))
    throw new Error("Usage: node .github/ci/ci.mjs plan KIND | run KIND -- COMMAND ...");
  const plan = createPlan(root, kind);
  reportPlan(root, plan);
  if (action === "plan") {
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    return;
  }
  if (rest[0] !== "--" || !rest[1]) throw new Error("Expected -- and an executable");
  let [executable, ...args] = rest.slice(1);
  if (!plan.run) {
    report(root, `task-${kind}`, { plan, skipped: true, durationMs: 0, exitCode: 0 });
    return;
  }
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const isTurbo =
    executable === "pnpm" &&
    args.length === 1 &&
    ["test", "typecheck", "build"].includes(args[0]) &&
    manifest.scripts?.[args[0]] === `turbo run ${args[0]}`;
  const affected = isTurbo && plan.mode === "affected" && plan.scope === "packages";
  if (isTurbo)
    args = ["exec", "turbo", "run", args[0], "--summarize", ...(affected ? ["--affected"] : [])];
  const started = Date.now();
  const child = spawn(executable, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...(affected ? { TURBO_SCM_BASE: plan.mergeBase, TURBO_SCM_HEAD: plan.head } : {}),
    },
  });
  const forward = (signal) => child.kill(signal);
  const onTerm = () => forward("SIGTERM");
  const onInt = () => forward("SIGINT");
  process.on("SIGTERM", onTerm);
  process.on("SIGINT", onInt);
  const result = await new Promise((resolve) => {
    child.on("error", (error) => resolve({ exitCode: 1, error: error.message }));
    child.on("exit", (code, signal) => resolve({ exitCode: code ?? 1, signal }));
  });
  process.off("SIGTERM", onTerm);
  process.off("SIGINT", onInt);
  const summaries = turboSummaries(root, started);
  const missedFailures = summaries.flatMap((summary) =>
    (summary.tasks || [])
      .filter(
        (task) =>
          task.execution?.exitCode > 0 &&
          plan.scope === "packages" &&
          !plan.packages.includes(task.task.split("#")[0]),
      )
      .map((task) => task.task),
  );
  report(root, `task-${kind}-${started}`, {
    plan,
    command: [executable, ...args],
    startedAt: new Date(started).toISOString(),
    durationMs: Date.now() - started,
    ...result,
    turbo: summaries,
    shadowMissedFailures: missedFailures,
  });
  process.exitCode = result.exitCode;
};

run().catch((error) => {
  process.stderr.write(`CI runtime failed: ${error.stack}\n`);
  process.exitCode = 1;
});

/* oxlint-disable node/no-sync -- This short-lived CLI reads bounded Git metadata before starting asynchronous project tasks. */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const VERSION = 1;
const PROFILES = ["saas", "library", "blog", "tool", "package", "site", "control"];
const KINDS = ["test", "typecheck", "build", "lint", "e2e", "packaging", "check", "rust", "docs"];
const git = (root, ...args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });

export const readPolicy = (root) => {
  const policy = JSON.parse(readFileSync(join(root, ".github/ci/policy.json"), "utf8"));
  if (
    policy.version !== VERSION ||
    !PROFILES.includes(policy.profile) ||
    !["shadow", "affected"].includes(policy.mode)
  ) {
    throw new Error("Unsupported CI policy: expected version, profile and shadow/affected mode");
  }
  return policy;
};

export const standaloneDocumentation = (path) =>
  /^(?:README|CHANGELOG|CONTRIBUTING|CODE_OF_CONDUCT|AGENTS|CLAUDE)\.md$/.test(path) ||
  /^LICENSE(?:\.[a-zA-Z]+)?$/.test(path) ||
  /^\.changeset\/[^/]+\.md$/.test(path);

export const changedPaths = (root, base, head) => {
  // Disabling rename detection retains both the deleted and added paths.
  return git(root, "diff", "--no-renames", "--name-only", "-z", base, head, "--")
    .split("\0")
    .filter(Boolean)
    .sort();
};

export const workspacePackages = (root) => {
  const files = git(root, "ls-files", "-z").split("\0");
  return files
    .filter((p) => /^(?:apps|packages|tools)\/[^/]+\/package\.json$/.test(p))
    .map((file) => {
      const manifest = JSON.parse(readFileSync(join(root, file), "utf8"));
      if (typeof manifest.name !== "string" || !manifest.name)
        throw new Error(`Unnamed workspace: ${file}`);
      return {
        name: manifest.name,
        directory: file.slice(0, -13),
        dependencies: Object.keys({
          ...manifest.dependencies,
          ...manifest.devDependencies,
          ...manifest.peerDependencies,
          ...manifest.optionalDependencies,
        }),
      };
    });
};

export const affectedPackages = (packages, paths) => {
  const affected = new Set();
  for (const path of paths) {
    const owner = packages.find((pkg) => path.startsWith(`${pkg.directory}/`));
    if (!owner || path.endsWith("/package.json")) return null;
    affected.add(owner.name);
  }
  let grew = true;
  while (grew) {
    grew = false;
    for (const pkg of packages) {
      if (!affected.has(pkg.name) && pkg.dependencies.some((name) => affected.has(name))) {
        affected.add(pkg.name);
        grew = true;
      }
    }
  }
  return [...affected].sort();
};

export const classify = (profile, kind, paths, packages = []) => {
  if (paths.length === 0)
    return { scope: "full", reason: "Empty diff: validate the tested revision", packages: [] };
  if (paths.every(standaloneDocumentation)) {
    return {
      scope: ["lint", "check"].includes(kind) ? "full" : "skip",
      reason: "Only standalone repository documentation changed",
      packages: [],
    };
  }
  if (profile === "control") {
    const rust =
      /^(?:crates\/|Cargo\.(?:toml|lock)$|rust-toolchain\.toml$|standards\.(?:md|toml)$|konsistent\.json$|fleet\.json$|tools\/|assets\/ci\/|content\/docs\/command-reference\.mdx$|\.github\/)/;
    const docs =
      /^(?:app\/|components\/|content\/|lib\/|public\/|assets\/|package\.json$|pnpm-|next\.|tsconfig|postcss|source\.config|\.github\/)/;
    const known = (path) => rust.test(path) || docs.test(path) || standaloneDocumentation(path);
    if (paths.every(known) && kind === "rust" && !paths.some((path) => rust.test(path))) {
      return {
        scope: "skip",
        reason: "Only documentation application inputs changed",
        packages: [],
      };
    }
    if (paths.every(known) && kind === "docs" && !paths.some((path) => docs.test(path))) {
      return { scope: "skip", reason: "Only Rust/control-plane inputs changed", packages: [] };
    }
  }
  if (
    ["saas", "library", "tool"].includes(profile) &&
    ["test", "typecheck", "build"].includes(kind)
  ) {
    const sourcePaths = paths.filter((path) => !standaloneDocumentation(path));
    const affected = affectedPackages(packages, sourcePaths);
    if (affected?.length)
      return {
        scope: "packages",
        reason: "Workspace sources and their reverse dependencies changed",
        packages: affected,
      };
  }
  return {
    scope: "full",
    reason: "Shared, application, dependency or unclassified inputs require full validation",
    packages: [],
  };
};

export const createPlan = (root, kind, env = process.env) => {
  if (!KINDS.includes(kind)) throw new Error(`Unknown validation kind: ${kind}`);
  const policy = readPolicy(root);
  const plan = {
    version: VERSION,
    profile: policy.profile,
    mode: policy.mode,
    kind,
    event: env.GITHUB_EVENT_NAME || "local",
    base: null,
    mergeBase: null,
    head: null,
    paths: [],
    packages: [],
    scope: "full",
    run: true,
    reason: "Full validation outside pull requests",
  };
  try {
    plan.head = git(root, "rev-parse", "HEAD").trim();
    if (plan.event !== "pull_request" && !env.CI_DIFF_BASE) return plan;
    const event = env.GITHUB_EVENT_PATH
      ? JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8"))
      : {};
    const base = env.CI_DIFF_BASE || event.pull_request?.base?.sha;
    const sourceHead = env.CI_DIFF_HEAD || event.pull_request?.head?.sha;
    if (!base || !/^[0-9a-f]{40}$/.test(base)) throw new Error("Exact base revision is missing");
    if (sourceHead && !/^[0-9a-f]{40}$/.test(sourceHead))
      throw new Error("Invalid PR head revision");
    plan.base = base;
    // Validate GitHub's tested merge commit, while including the complete PR diff.
    if (sourceHead) git(root, "merge-base", "--is-ancestor", sourceHead, plan.head);
    plan.mergeBase = git(root, "merge-base", base, sourceHead || plan.head).trim();
    plan.paths = changedPaths(root, plan.mergeBase, plan.head);
    const packages = ["saas", "library", "tool"].includes(policy.profile)
      ? workspacePackages(root)
      : [];
    Object.assign(plan, classify(policy.profile, kind, plan.paths, packages));
    plan.run = policy.mode === "shadow" || plan.scope !== "skip";
  } catch (error) {
    plan.scope = "full";
    plan.run = true;
    plan.reason = `Uncertain change set: ${error.message.split("\n")[0]}`;
    plan.packages = [];
  }
  return plan;
};

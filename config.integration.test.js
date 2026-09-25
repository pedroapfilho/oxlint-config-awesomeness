import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import oxlintPackage from "oxlint/package.json" with { type: "json" };
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const OXLINT = fileURLToPath(
  new URL(oxlintPackage.bin.oxlint, import.meta.resolve("oxlint/package.json")),
);

let cwd;

beforeEach(() => {
  // Keep package self-references and peer plugins resolvable from the fixture config.
  cwd = mkdtempSync(join(import.meta.dirname, ".oxlint-fixtures-"));
  writeFileSync(
    join(cwd, "oxlint.config.mjs"),
    `import config from "oxlint-config-awesomeness";
export default {
  extends: [config],
  options: { typeAware: false, typeCheck: false },
};
`,
  );
});

afterEach(() => {
  rmSync(cwd, { force: true, recursive: true });
});

// Framework imports are parser inputs; no framework installation or type checker is needed.
const lint = (files) => {
  for (const [filename, source] of Object.entries(files)) {
    const path = join(cwd, filename);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, source);
  }

  const result = spawnSync(
    process.execPath,
    [OXLINT, "--config", "oxlint.config.mjs", "--format=json", ...Object.keys(files)],
    { cwd, encoding: "utf8", timeout: 30_000 },
  );

  expect(result.error).toBeUndefined();
  expect(result.stderr).toBe("");
  expect([0, 1]).toContain(result.status);

  return JSON.parse(result.stdout).diagnostics.map(({ code, filename }) => ({ code, filename }));
};

describe("TanStack route options through Oxlint", () => {
  it.each([
    'createFileRoute("/posts")',
    "createRoute",
    "createRootRoute",
    "createRootRouteWithContext<Context>()",
  ])("leaves %s in inference order and rejects alphabetical order", (factory) => {
    const diagnostics = lint({
      "alphabetical.ts": `export const Route = ${factory}({
  beforeLoad: ensureSession,
  loader: loadPosts,
  validateSearch: schema,
});`,
      "ordered.ts": `export const Route = ${factory}({
  validateSearch: schema,
  beforeLoad: ensureSession,
  loader: loadPosts,
});`,
    });

    expect(diagnostics.filter(({ code }) => code === "perfectionist(sort-objects)")).toEqual([]);
    expect(
      diagnostics.filter(
        ({ code }) => code === "react-doctor(tanstack-start-route-property-order)",
      ),
    ).toEqual([
      { code: "react-doctor(tanstack-start-route-property-order)", filename: "alphabetical.ts" },
    ]);
  });

  it("still sorts ordinary objects, unrelated factories, and objects inside loaders", () => {
    const diagnostics = lint({
      "nested.ts": `export const Route = createRootRouteWithContext<Context>()({
  loader: () => ({ zebra: 1, apple: 2 }),
});`,
      "ordinary.ts": "export const options = { zebra: 1, apple: 2 };",
      "unrelated.ts": "export const options = createAuditRoute({ zebra: 1, apple: 2 });",
    });

    expect(
      diagnostics
        .filter(({ code }) => code === "perfectionist(sort-objects)")
        .map(({ filename }) => filename)
        .toSorted(),
    ).toEqual(["nested.ts", "ordinary.ts", "unrelated.ts"]);
  });
});

describe("Vitest assertion coverage through Oxlint", () => {
  it.each(["sample.test.js", "sample.spec.js", "__tests__/sample.js"])(
    "checks assertions in %s",
    (filename) => {
      const diagnostics = lint({
        [filename]: `import { expect, test } from "vitest";

test("loads data", () => {
  expect(Promise.resolve("data")).resolves.toBe("data");
});
test("does nothing", () => {});
`,
      });

      expect(diagnostics).toContainEqual({ code: "vitest(valid-expect)", filename });
      expect(diagnostics).toContainEqual({ code: "vitest(expect-expect)", filename });
    },
  );

  it("accepts awaited assertions and assertion helpers", () => {
    const diagnostics = lint({
      "valid.test.js": `import { expect, test } from "vitest";

test("loads data", async () => {
  await expect(Promise.resolve("data")).resolves.toBe("data");
});
test("checks data", () => { assertData(); });
`,
    });

    expect(diagnostics.filter(({ code }) => code.startsWith("vitest("))).toEqual([]);
  });

  it("does not enable Vitest rules outside test files", () => {
    const diagnostics = lint({
      "ordinary.js": `import { expect, test } from "vitest";

test("loads data", () => {
  expect(Promise.resolve("data")).resolves.toBe("data");
});
`,
    });

    expect(diagnostics.filter(({ code }) => code.startsWith("vitest("))).toEqual([]);
  });

  it("does not mistake Playwright imports for supported Vitest assertions", () => {
    const diagnostics = lint({
      "playwright.spec.js": `import { expect, test } from "@playwright/test";

test("loads data", () => {
  expect(Promise.resolve("data")).resolves.toBe("data");
});
test("does nothing", () => {});
`,
    });

    expect(diagnostics.filter(({ code }) => code.startsWith("vitest("))).toEqual([]);
  });
});

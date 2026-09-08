import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const temporaryDirectory = await mkdtemp(join(tmpdir(), "oxlint-config-build-"));

try {
  await execFileAsync(
    "pnpm",
    ["exec", "tsc", "-p", "tsconfig.build.json", "--outDir", temporaryDirectory],
    { cwd: root },
  );

  for (const filename of await readdir(temporaryDirectory)) {
    const [expected, current] = await Promise.all([
      readFile(join(temporaryDirectory, filename)),
      readFile(join(root, "dist", filename)),
    ]);

    if (!expected.equals(current)) {
      throw new Error(`dist/${filename} is stale. Run pnpm build.`);
    }
  }
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}

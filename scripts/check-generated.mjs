import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual, promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const temporaryDirectory = await mkdtemp(join(tmpdir(), "oxlint-config-build-"));

const generatedFiles = async (directory) => {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => !entry.isDirectory())
    .map((entry) => relative(directory, join(entry.parentPath, entry.name)))
    .toSorted();
};

try {
  await execFileAsync(
    "pnpm",
    ["exec", "tsc", "-p", "tsconfig.build.json", "--outDir", temporaryDirectory],
    { cwd: root },
  );

  const [expectedFiles, currentFiles] = await Promise.all([
    generatedFiles(temporaryDirectory),
    generatedFiles(join(root, "dist")),
  ]);

  if (!isDeepStrictEqual(expectedFiles, currentFiles)) {
    throw new Error("dist file inventory is stale. Run pnpm build.");
  }

  for (const filename of expectedFiles) {
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

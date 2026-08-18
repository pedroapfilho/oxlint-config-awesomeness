import type { Comment } from "@oxlint/plugins";
import { definePlugin, defineRule } from "@oxlint/plugins";

const MAX_LINES = 5;
const LICENSE_SCAN_LINES = 2;

const EXEMPT_PATTERNS: ReadonlyArray<RegExp> = [
  /^\s*eslint-/v,
  /^\s*oxlint-/v,
  /^\s*@ts-/v,
  /^\s*prettier-/v,
  /^\s*biome-/v,
  /^\s*istanbul\s/v,
  /^\s*v8\s/v,
  /^\s*@vitest-/v,
  /^\s*@jsx/v,
  /^\s*\/\s*<reference/v,
  /^!/v,
];

const LICENSE_PATTERN = /@license|@preserve|SPDX-License-Identifier|^\s*\*?\s*Copyright\b/v;

const isExempt = (comment: Comment): boolean =>
  EXEMPT_PATTERNS.some((pattern) => pattern.test(comment.value));

const proseLines = (comment: Comment): Array<string> => comment.value.split("\n");

const startsLicenseHeader = (lines: ReadonlyArray<string>): boolean =>
  lines.slice(0, LICENSE_SCAN_LINES).some((line) => LICENSE_PATTERN.test(line));

const groupRuns = (comments: ReadonlyArray<Comment>): Array<Array<Comment>> => {
  const runs: Array<Array<Comment>> = [];

  for (const comment of comments) {
    const currentRun = runs.at(-1);
    const previous = currentRun?.at(-1);
    const continuesRun =
      currentRun !== undefined &&
      previous !== undefined &&
      previous.type === "Line" &&
      comment.type === "Line" &&
      comment.loc.start.line === previous.loc.end.line + 1;

    if (continuesRun) {
      currentRun.push(comment);
    } else {
      runs.push([comment]);
    }
  }

  return runs;
};

const noNovelCommentsRule = defineRule({
  create(context) {
    return {
      Program() {
        const comments = context.sourceCode
          .getAllComments()
          .filter((comment) => comment.type !== "Shebang" && !isExempt(comment));

        for (const run of groupRuns(comments)) {
          const lines = run.flatMap(proseLines);

          if (lines.length > MAX_LINES && !startsLicenseHeader(lines)) {
            context.report({
              data: { lines: String(lines.length), maxLines: String(MAX_LINES) },
              loc: run[0].loc,
              messageId: "novelComment",
            });
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        "Disallow prose-heavy comments; long narration belongs in names and structure, not comments.",
    },
    messages: {
      novelComment:
        "This comment spans {{lines}} lines (limit {{maxLines}}). Cut it down to the non-obvious constraint; if the code needs this much narration, restructure the code instead.",
    },
    type: "suggestion",
  },
});

const awesomenessPlugin = definePlugin({
  meta: { name: "awesomeness" },
  rules: {
    "no-novel-comments": noNovelCommentsRule,
  },
});

export default awesomenessPlugin;

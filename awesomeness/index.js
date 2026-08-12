import { definePlugin, defineRule } from "@oxlint/plugins";

const DEFAULT_MAX_LINES = 5;

const EXEMPT_PATTERNS = [
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
  /@license|@preserve|SPDX-License-Identifier|^\s*Copyright\b/v,
];

const isExempt = (comment) =>
  EXEMPT_PATTERNS.some((pattern) => pattern.test(comment.value));

const lineSpan = (comment) => comment.loc.end.line - comment.loc.start.line + 1;

const noNovelCommentsRule = defineRule({
  create(context) {
    const maxLines = context.options?.[0]?.maxLines ?? DEFAULT_MAX_LINES;

    const report = (comment, lines) => {
      context.report({
        data: { lines: String(lines), maxLines: String(maxLines) },
        loc: comment.loc,
        messageId: "novelComment",
      });
    };

    return {
      Program() {
        const comments = context.sourceCode
          .getAllComments()
          .filter((comment) => comment.type !== "Shebang" && !isExempt(comment));

        let run = [];
        const flushRun = () => {
          if (run.length > maxLines) {
            report(run[0], run.length);
          }
          run = [];
        };

        for (const comment of comments) {
          if (comment.type === "Block") {
            flushRun();
            const lines = lineSpan(comment);
            if (lines > maxLines) {
              report(comment, lines);
            }
            continue;
          }
          const previous = run.at(-1);
          if (previous && comment.loc.start.line !== previous.loc.end.line + 1) {
            flushRun();
          }
          run.push(comment);
        }
        flushRun();
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

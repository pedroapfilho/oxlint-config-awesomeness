import { describe, expect, it } from "vitest";

import awesomenessPlugin from "./awesomeness.ts";

const createLineComment = (value, line) => ({
  loc: {
    end: { column: value.length + 2, line },
    start: { column: 0, line },
  },
  type: "Line",
  value,
});

const createBlockComment = (value, startLine) => ({
  loc: {
    end: { column: 2, line: startLine + value.split("\n").length - 1 },
    start: { column: 0, line: startLine },
  },
  type: "Block",
  value,
});

const runCommentRule = (ruleName, comments) => {
  const reports = [];

  const visitors = awesomenessPlugin.rules[ruleName].create({
    report: (report) => reports.push(report),
    sourceCode: { getAllComments: () => comments },
  });

  const runProgram = visitors.Program;

  runProgram();

  return reports;
};

const runNoNovelComments = (comments) => runCommentRule("no-novel-comments", comments);

const lineRun = (values, startLine = 1) =>
  values.map((value, index) => createLineComment(value, startLine + index));

const prose = (count, startLine = 1) =>
  lineRun(
    Array.from({ length: count }, (_, index) => ` prose ${index + 1}`),
    startLine,
  );

const plainBlock = (body) => `\n${body.map((line) => ` ${line}`).join("\n")}\n`;

const jsdocBlock = (body) => `*\n${body.map((line) => ` * ${line}`).join("\n")}\n `;

const APACHE_BODY = [
  "Copyright (c) 2026 Example",
  'Licensed under the Apache License, Version 2.0 (the "License");',
  "you may not use this file except in compliance with the License.",
  "You may obtain a copy of the License at",
  "https://www.apache.org/licenses/LICENSE-2.0",
  "Unless required by applicable law or agreed to in writing, software",
  'distributed under the License is distributed on an "AS IS" BASIS,',
  "WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
  "See the License for the specific language governing permissions and",
  "limitations under the License.",
];

const repeated = (count, line) => Array.from({ length: count }, () => line);

const proseBlock = (count) => createBlockComment(plainBlock(repeated(count, "prose")), 1);

describe("awesomeness/no-novel-comments", () => {
  it.each([
    {
      comments: prose(6),
      expected: 1,
      name: "reports a 6-line run of line comments",
    },
    {
      comments: prose(5),
      expected: 0,
      name: "allows a run sitting exactly at the limit",
    },
    {
      comments: [...prose(3), ...prose(3, 5)],
      expected: 0,
      name: "a blank source line splits one long run into two short runs",
    },
    {
      comments: [
        ...prose(3),
        createLineComment(" eslint-disable-next-line no-console", 4),
        ...prose(3, 5),
      ],
      expected: 0,
      name: "a directive comment splits the run instead of joining it",
    },
    {
      comments: lineRun(APACHE_BODY.map((line) => ` ${line}`)),
      expected: 0,
      name: "exempts a complete line-comment license header",
    },
    {
      comments: [createBlockComment(plainBlock(APACHE_BODY), 1)],
      expected: 0,
      name: "exempts a plain block license header",
    },
    {
      comments: [createBlockComment(jsdocBlock(APACHE_BODY), 1)],
      expected: 0,
      name: "exempts a JSDoc-style license header",
    },
    {
      comments: [createBlockComment(jsdocBlock(["@license MIT"]), 1)],
      expected: 0,
      name: "exempts a JSDoc @license marker on the second prose line",
    },
    {
      comments: [proseBlock(6)],
      expected: 1,
      name: "reports a block comment longer than the limit",
    },
    {
      comments: [proseBlock(3)],
      expected: 0,
      name: "allows a block comment at the limit",
    },
    {
      comments: [createBlockComment(`!\n${repeated(8, " prose").join("\n")}`, 1)],
      expected: 0,
      name: "exempts a bang-prefixed preserve block",
    },
    {
      comments: [...prose(9), createLineComment(" Copyright headers go in new files", 10)],
      expected: 1,
      name: "a trailing Copyright mention does not exempt a long prose run",
    },
    {
      comments: [...prose(3), createBlockComment(plainBlock(["prose"]), 4), ...prose(3, 6)],
      expected: 0,
      name: "a block comment interrupts an otherwise contiguous line run",
    },
    {
      comments: [
        ...prose(3),
        createBlockComment(" eslint-disable ", 4),
        createLineComment(" prose 4", 4),
        ...prose(3, 5),
      ],
      expected: 1,
      name: "an exempt block does not hide prose sharing its source line",
    },
  ])("$name", ({ comments, expected }) => {
    expect(runNoNovelComments(comments)).toHaveLength(expected);
  });
});

describe("awesomeness/require-disable-reason", () => {
  it.each([
    { comment: " oxlint-disable-next-line no-console", expected: 1 },
    { comment: " eslint-disable-line no-console, no-alert", expected: 1 },
    { comment: " oxlint-disable-next-line no-console -- ", expected: 1 },
    { comment: " oxlint-disable-next-line no-console -- CLI output is the product", expected: 0 },
    { comment: " eslint-disable-next-line no-console -- CLI output", expected: 0 },
    { comment: " eslint-enable no-console", expected: 0 },
    { comment: " oxlint-disabled is not a directive", expected: 0 },
    { comment: " prose that mentions oxlint-disable later", expected: 0 },
  ])("reports $expected for `$comment`", ({ comment, expected }) => {
    const reports = runCommentRule("require-disable-reason", [createLineComment(comment, 1)]);
    expect(reports).toHaveLength(expected);
  });

  it("checks block and file-level directives", () => {
    const reports = runCommentRule("require-disable-reason", [
      createBlockComment(" oxlint-disable node/no-sync ", 1),
      createBlockComment(" oxlint-disable node/no-sync -- bounded CLI read ", 2),
    ]);

    expect(reports).toHaveLength(1);
  });
});

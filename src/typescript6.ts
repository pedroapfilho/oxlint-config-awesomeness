import { registerHooks } from "node:module";

const TYPESCRIPT_SPECIFIER = /^typescript(?=\/|$)/v;

// shortcut: typescript-eslint throws when it loads TypeScript 7, delete once it supports it (typescript-eslint#10940)
registerHooks({
  resolve: (specifier, context, nextResolve) =>
    TYPESCRIPT_SPECIFIER.test(specifier)
      ? {
          shortCircuit: true,
          url: import.meta.resolve(
            specifier.replace(TYPESCRIPT_SPECIFIER, "@typescript/typescript6"),
          ),
        }
      : nextResolve(specifier, context),
});

import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'error',
    pedantic: 'error',
    perf: 'error',
    style: 'error',
    suspicious: 'error',
  },
  env: {
    browser: true,
    builtin: true,
    es2024: true,
    node: true,
  },
  jsPlugins: [
    'eslint-plugin-no-only-tests',
    'eslint-plugin-perfectionist',
    'eslint-plugin-unused-imports',
    { name: 'react-hooks-js', specifier: 'eslint-plugin-react-hooks' },
  ],
  overrides: [
    // TypeScript files — disable rules handled natively by the TS compiler
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
      rules: {
        'constructor-super': 'off',
        'getter-return': 'off',
        'no-class-assign': 'off',
        'no-const-assign': 'off',
        'no-dupe-class-members': 'off',
        'no-dupe-keys': 'off',
        'no-func-assign': 'off',
        'no-import-assign': 'off',
        'no-new-native-nonconstructor': 'off',
        'no-obj-calls': 'off',
        'no-redeclare': 'off',
        'no-setter-return': 'off',
        'no-this-before-super': 'off',
        'no-undef': 'off',
        'no-unreachable': 'off',
        'no-unsafe-negation': 'off',
        'no-with': 'off',
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
      },
    },
    // Test files — relax strict rules that create noise in tests
    {
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/__tests__/**',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        'max-nested-callbacks': 'off',
        'max-statements': 'off',
        'no-empty-function': 'off',
      },
    },
    // Storybook stories — relax rules for component documentation
    {
      files: ['**/*.stories.ts', '**/*.stories.tsx'],
      rules: {
        'no-console': 'off',
        'react/no-multi-comp': 'off',
      },
    },
    // Seed and migration files — allow console for CLI output
    {
      files: ['**/seed.ts', '**/seed.js', '**/migrate.ts', '**/migrate.js'],
      rules: {
        'no-console': 'off',
      },
    },
    // Config files — relax rules for tooling configs
    {
      files: [
        '*.config.ts',
        '*.config.js',
        '*.config.mjs',
        '*.config.mts',
        '**/.storybook/**',
        'vitest.config.*',
        'playwright.config.*',
        'tailwind.config.*',
        'postcss.config.*',
        'next.config.*',
      ],
      rules: {
        'import-x/no-anonymous-default-export': 'off',
        'max-lines': 'off',
      },
    },
    // E2E test fixtures — may not follow standard component rules
    {
      files: ['**/e2e/**/fixtures/**', '**/e2e/**/*.ts'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
      },
    },
  ],
  plugins: [
    'typescript',
    'import',
    'react',
    'unicorn',
    'jsx-a11y',
    'promise',
    'nextjs',
    'oxc',
    'node',
  ],
  rules: {
    // TypeScript — custom options
    '@typescript-eslint/array-type': [
      'error',
      {
        default: 'generic',
      },
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

    // Core eslint — custom options
    'no-warning-comments': [
      'error',
      {
        terms: ['@nocommit'],
      },
    ],

    // Restriction — cherry-picked (not bulk-enabled)
    curly: 'error',
    'default-case': 'error',
    eqeqeq: 'error',
    'grouped-accessor-pairs': 'error',
    'id-length': ['error', { exceptions: ['_', 'a', 'b', 'i', 'j', 'k', 'x', 'y', 'z'] }],
    'max-classes-per-file': ['error', { max: 1 }],
    'max-depth': ['error', { max: 4 }],
    'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
    'max-nested-callbacks': ['error', { max: 3 }],
    'max-params': ['error', { max: 4 }],
    'no-alert': 'error',
    'no-caller': 'error',
    'no-console': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-implicit-coercion': ['error', { allow: ['!!'] }],
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-object-constructor': 'error',
    'no-param-reassign': 'error',
    'no-proto': 'error',
    'no-return-assign': 'error',
    'no-script-url': 'error',
    'no-shadow': 'error',
    'no-throw-literal': 'error',
    'no-void': ['error', { allowAsStatement: true }],
    'prefer-promise-reject-errors': 'error',
    'prefer-template': 'error',

    // Style overrides — handled by perfectionist/oxfmt
    'sort-imports': 'off',
    'sort-keys': 'off',
    'sort-vars': 'off',

    // Unicorn — enforce kebab-case but allow Next.js bracket patterns
    // Next.js dynamic routes ([slug], [...catchAll]) and special files (_app, _document)
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
        ignore: [String.raw`\[.*\]`, '^_.*'],
      },
    ],
    'unicorn/no-null': 'off',

    // Perfectionist — sorting
    'perfectionist/sort-enums': [
      'error',
      {
        partitionByComment: true,
        sortByValue: 'always',
      },
    ],
    'perfectionist/sort-heritage-clauses': 'error',
    'perfectionist/sort-jsx-props': 'error',
    'perfectionist/sort-object-types': 'error',
    'perfectionist/sort-objects': [
      'error',
      {
        partitionByComment: true,
      },
    ],

    // React Compiler (react-hooks-js)
    'react-hooks-js/component-hook-factories': 'error',
    'react-hooks-js/config': 'error',
    'react-hooks-js/error-boundaries': 'error',
    'react-hooks-js/gating': 'error',
    'react-hooks-js/globals': 'error',
    'react-hooks-js/immutability': 'error',
    'react-hooks-js/incompatible-library': 'error',
    'react-hooks-js/preserve-manual-memoization': 'error',
    'react-hooks-js/purity': 'error',
    'react-hooks-js/refs': 'error',
    'react-hooks-js/set-state-in-effect': 'error',
    'react-hooks-js/set-state-in-render': 'error',
    'react-hooks-js/static-components': 'error',
    'react-hooks-js/unsupported-syntax': 'error',
    'react-hooks-js/use-memo': 'error',

    // React hooks
    'react-hooks/exhaustive-deps': 'error',
    'react-hooks/rules-of-hooks': 'error',

    // No only tests
    'no-only-tests/no-only-tests': 'error',

    // Unused imports
    'unused-imports/no-unused-imports': 'error',
  },
});

import { dirname, join } from 'node:path/posix';

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import eslintImportX from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import markdown from 'eslint-plugin-markdown';
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import { findUp } from 'find-up';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * @param {string} ext - File extension.
 * @returns string - Glob pattern.
 */
const makeFilePattern = ext => `**/*${ext}`;

/**
 * File extensions per language (variant), including dot, e.g. `.js`.
 */
const fileExtensions = {
  js: ['.js', '.cjs', '.mjs', '.jsx'],
  ts: ['.ts', '.cts', '.mts', '.tsx'],
  svelte: ['.svelte'],
  markdown: ['.md'],
};
/**
 * Glob patterns per language (variant), e.g. `**\/*.js`.
 */
const filePatterns = {
  js: fileExtensions.js.map(makeFilePattern),
  ts: fileExtensions.ts.map(makeFilePattern),
  svelte: fileExtensions.svelte.map(makeFilePattern),
  markdown: fileExtensions.markdown.map(makeFilePattern),
  markdownCodeBlocks: fileExtensions.markdown.map(ext => `**/*${ext}/**`),
};

/**
 * JavaScript related file extensions, including dot, e.g. `.js`.
 */
const allJsEcosystemFileExtensions = [
  ...fileExtensions.js,
  ...fileExtensions.ts,
  ...fileExtensions.svelte,
];
/**
 * JavaScript related glob patterns, e.g. `**\/*.js`.
 */
const allJsEcosystemFilePatterns = [
  ...filePatterns.js,
  ...filePatterns.ts,
  ...filePatterns.svelte,
];

/**
 * @type {import('./default.js').config}
 */
export const config = async ({
  configs,
  cwd = process.cwd(),
  svelteWorkspaces = [],
  workspaces: workspaces_,
}) => {
  const rootFilePath = await findUp(['bun.lockb', 'pnpm-workspace.yaml'], { cwd });
  if (!rootFilePath) throw new Error('Could not find workspace root directory.');
  const rootDir = dirname(rootFilePath);

  const withSvelte = svelteWorkspaces.length > 0;
  const eslintPluginSvelte = withSvelte && (await import('eslint-plugin-svelte'));

  const workspaces = [...workspaces_, ...svelteWorkspaces];

  return tseslint.config(
    /*
     * ──────────────────────────────────────────────────
     * MARK: Ignore patterns.
     * ──────────────────────────────────────────────────
     */

    {
      name: 'global-ignores',
      ignores: [
        '**/node_modules',
        '**/*.min.cjs',
        '**/*.min.js',
        '**/*.min.mjs',
        '**/.DS_Store',
        '**/.env',
        '**/.env.*',
        '**/!.env.sample',
        '**/bun.lockb',
        '**/package-lock.json',
        '**/pnpm-lock.yaml',
      ],
    },

    {
      name: 'workspace-ignores',
      ignores: ['.turbo', 'build', 'coverage', 'dist', '.svelte-kit'].flatMap(path =>
        workspaces.map(base => join(base, path)),
      ),
    },

    /*
     * ──────────────────────────────────────────────────
     * MARK: General (ESLint).
     * ──────────────────────────────────────────────────
     */

    {
      extends: [eslint.configs.recommended],

      name: 'eslint-recommended',

      rules: {
        'max-len': 'off',
        'no-undef': 'off',

        'no-await-in-loop': 'error',

        'no-implicit-coercion': 'warn',
        'no-magic-numbers': 'off',

        // Autofix (reporting suppressed in vscode).
        'sort-vars': 'warn',
      },
    },

    {
      name: 'global-language-options',
      files: allJsEcosystemFilePatterns,

      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.es2021,
        },
      },
    },

    /*
     * ──────────────────────────────────────────────────
     * MARK: Stylistic.
     * https://eslint.style/rules
     * ──────────────────────────────────────────────────
     */

    {
      name: 'stylistic',
      files: allJsEcosystemFilePatterns,

      plugins: {
        // @ts-ignore: Exists according to docs.
        '@stylistic': stylistic,
      },

      rules: {
        '@stylistic/generator-star-spacing': ['error', 'after'],
        // '@stylistic/multiline-comment-style': ['error'], // Also adds a star to commented out code...
      },
    },

    /*
     * ──────────────────────────────────────────────────
     * MARK: TypeScript.
     * ──────────────────────────────────────────────────
     */

    {
      extends: [
        // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-eslint/src/configs/strict-type-checked.ts
        ...tseslint.configs.strictTypeChecked,
        // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-eslint/src/configs/stylistic-type-checked.ts
        ...tseslint.configs.stylisticTypeChecked,
      ],

      name: 'typescript',
      files: allJsEcosystemFilePatterns,

      languageOptions: {
        parserOptions: {
          // projectService: {
          //   allowDefaultProject: ['**/*.md/*.ts'],
          //   defaultProject: './tsconfig.json',
          // },
          projectService: true,
          tsconfigRootDir: rootDir,
          extraFileExtensions: ['.svelte'],
        },
      },

      settings: {
        'svelte3/typescript': await import('typescript'),
      },

      rules: {
        '@typescript-eslint/ban-ts-comment': [
          'warn',
          {
            'ts-expect-error': 'allow-with-description',
            'ts-ignore': 'allow-with-description',
            'ts-nocheck': 'allow-with-description',
            minimumDescriptionLength: 3,
          },
        ],

        '@typescript-eslint/consistent-indexed-object-style': 'off',

        // Do not enforce `type`s for everything.
        '@typescript-eslint/consistent-type-definitions': ['off'],

        '@typescript-eslint/consistent-type-imports': [
          'error',
          { disallowTypeAnnotations: false },
        ],

        '@typescript-eslint/no-confusing-void-expression': [
          'warn',
          { ignoreArrowShorthand: true, ignoreVoidOperator: true },
        ],

        '@typescript-eslint/no-explicit-any': 'off',

        '@typescript-eslint/no-misused-promises': [
          'error',
          {
            /*
             * Allow Promises to be used in `setTimeout`, `setInterval`,
             * event callbacks, inside another Promise, etc...
             */
            checksVoidReturn: false,
          },
        ],

        // Do not disallow the use of custom/local modules and namespaces.
        '@typescript-eslint/no-namespace': 'off',

        '@typescript-eslint/no-non-null-assertion': 'off',

        '@typescript-eslint/no-this-alias': [
          'error',
          {
            // Allow `const self = this`.
            allowedNames: ['self'],
          },
        ],

        '@typescript-eslint/no-unnecessary-condition': [
          'warn',
          {
            allowConstantLoopConditions: true,
          },
        ],

        '@typescript-eslint/require-await': 'warn',

        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            caughtErrors: 'none',
            argsIgnorePattern: '^__',
            varsIgnorePattern: '^__',
            destructuredArrayIgnorePattern: '^__',
          },
        ],
      },
    },

    /*
     * ──────────────────────────────────────────────────
     * MARK: Svelte.
     * ──────────────────────────────────────────────────
     */

    eslintPluginSvelte && {
      extends: [
        ...eslintPluginSvelte.configs['flat/recommended'],
        ...eslintPluginSvelte.configs['flat/prettier'],
      ],

      name: 'svelte',
      files: filePatterns.svelte,

      languageOptions: {
        parserOptions: {
          parser: tseslint.parser,
        },
      },

      rules: {
        /*
         * Svelte compiler errors are already handled by the VSCode Svelte Extension.
         * We don't need this rule as long as we're not running ESLint in CI.
         */
        'svelte/valid-compile': 'off',

        /*
         * Disabling condition checking because Typescript doesn't recognize that a variable
         * such as `export let value = 'defValue'` can be updated by a parent component,
         * and therefore incorrectly warns when we use it in a condition like `if (value === 'defValue') {...}`.
         */
        '@typescript-eslint/no-unnecessary-condition': 'off',

        // Rules conflicting with: `const { children } = $props();`
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',

        // Rules conflicting with: `{@render hello('etienne')}`
        '@typescript-eslint/no-confusing-void-expression': 'off',

        // Disabling other strange behaviours
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },

    eslintPluginSvelte && {
      name: 'svelte-overrides',
      files: svelteWorkspaces.flatMap(base =>
        allJsEcosystemFilePatterns.map(pattern => join(base, pattern)),
      ),

      rules: {
        /*
         * Disable checking for SvelteKit-specific ambient imports until the issue is resolved:
         * https://github.com/import-js/eslint-import-resolver-typescript/issues/261
         */
        'import-x/no-unresolved': [
          'warn',
          {
            ignore: [String.raw`^\$app/`, String.raw`^\$env/(static|dynamic)/`],
          },
        ],
      },
    },

    /*
     * ──────────────────────────────────────────────────
     * MARK: Import-X.
     * ──────────────────────────────────────────────────
     */

    {
      name: 'import-x',
      files: allJsEcosystemFilePatterns,

      plugins: {
        'import-x': eslintImportX,
      },

      settings: {
        'import-x/extensions': allJsEcosystemFileExtensions,
        'import-x/parsers': {
          '@typescript-eslint/parser': fileExtensions.ts,
          'svelte-eslint-parser': fileExtensions.svelte,
        },
        'import-x/resolver': {
          exports: {
            /*
             * eslint-import-resolver-exports adds support for the 'exports'-field until
             * issue https://github.com/browserify/resolve/issues/222 has been resolved and integrated into
             * the default node resolver https://www.npmjs.com/package/eslint-import-resolver-node.
             *
             * Accepts the same options as the `resolve.exports` package,
             * see: https://github.com/lukeed/resolve.exports.
             */
          },
          typescript: {
            alwaysTryTypes: true,
            project: workspaces.map(base => join(base, 'tsconfig.json')),
          },
          node: {
            extensions: fileExtensions.js,
          },
        },
      },

      rules: {
        'import-x/no-absolute-path': 'error',

        // Autofix.
        'import-x/first': 'warn',

        // Autofix.
        'import-x/newline-after-import': 'warn',

        'import-x/no-default-export': 'warn',

        // Disabled 2024-06-12: TS 5.5-beta does not support inline type imports.
        // Autofix.
        'import-x/no-duplicates': [
          'warn',
          { 'prefer-inline': true, considerQueryString: true },
        ],

        'import-x/no-extraneous-dependencies': 'warn',
        'import-x/no-unresolved': 'error',
        'import-x/no-useless-path-segments': 'error',

        // Autofix.
        'import-x/order': [
          'warn',
          {
            groups: ['builtin', 'external', ['index', 'parent', 'sibling']],
            pathGroups: [
              {
                pattern: '{@,$}*/**',
                group: 'index',
              },
              {
                pattern: '../**',
                group: 'parent',
                position: 'after',
              },
              {
                pattern: '../**',
                group: 'sibling',
                position: 'after',
              },
            ],
            distinctGroup: false,
            // To also allow newlines within a group, use 'always-and-inside-groups'.
            'newlines-between': 'always',
            alphabetize: {
              // Sort alphabetical based on import path.
              order: 'asc',
              // Sort various import kinds. E.g. imports prefixed with type or typeof, with same import path.
              orderImportKind: 'asc',
              // Ignore case.
              caseInsensitive: true,
            },
          },
        ],
      },
    },

    /*
     * ──────────────────────────────────────────────────
     * MARK: Unicorn.
     * ──────────────────────────────────────────────────
     */

    {
      extends: [eslintPluginUnicorn.configs['flat/recommended']],

      name: 'unicorn',
      files: allJsEcosystemFilePatterns,

      rules: {
        'unicorn/no-array-callback-reference': 'off',
        'unicorn/no-await-expression-member': 'off',
        'unicorn/no-magic-array-flat-depth': 'off',

        'unicorn/import-style': [
          'warn',
          {
            styles: {
              chalk: false,
            },
          },
        ],

        'unicorn/better-regex': 'warn', // Autofix.
        'unicorn/error-message': 'error',
        'unicorn/filename-case': [
          'error',
          {
            cases: {
              kebabCase: true, // e.g. `foo-bar.test-utils.js`
              pascalCase: true, // e.g. `FooBar.Test.js`
            },
          },
        ],
        'unicorn/no-null': 'warn', // Autofix.
        'unicorn/prefer-array-find': ['warn', { checkFromLast: true }], // Autofix.
        'unicorn/prefer-at': 'warn', // Autofix.
        'unicorn/prefer-date-now': 'warn', // Autofix.
        'unicorn/prefer-default-parameters': 'warn', // Autofix.
        'unicorn/prefer-export-from': 'warn', // Autofix.
        'unicorn/no-anonymous-default-export': 'warn', // Since v52.0.
        'unicorn/prefer-includes': 'warn', // Autofix.
        'unicorn/prefer-logical-operator-over-ternary': 'error',
        'unicorn/prefer-module': 'warn', // Autofix.
        'unicorn/prefer-native-coercion-functions': 'warn', // Autofix.
        'unicorn/prefer-node-protocol': 'warn', // Autofix.
        'unicorn/prefer-spread': 'warn', // Autofix.
        'unicorn/no-useless-spread': 'warn', // Autofix.
        'unicorn/consistent-empty-array-spread': 'warn', // Since v53.0. Autofix.
        'unicorn/prefer-structured-clone': 'warn', // Since v53.0.
        'unicorn/no-single-promise-in-promise-methods': 'warn', // Since v52.0. Autofix.
        'unicorn/prefer-string-slice': 'warn', // Autofix.
        'unicorn/prefer-string-starts-ends-with': 'warn', // Autofix.
        'unicorn/prefer-string-trim-start-end': 'warn', // Autofix.
        'unicorn/prefer-string-raw': 'warn', // Since v53.0. Autofix.
        'unicorn/prefer-switch': 'warn', // Autofix.
        'unicorn/prefer-ternary': 'warn', // Autofix.
        'unicorn/prefer-top-level-await': 'warn',
        'unicorn/no-await-in-promise-methods': 'warn', // Since v52.0.
        'unicorn/no-invalid-fetch-options': 'error', // Since v53.0.
        'unicorn/template-indent': 'warn',
        'unicorn/numeric-separators-style': [
          'warn',
          {
            number: {
              minimumDigits: 4,
              groupLength: 3,
            },
          },
        ],

        /*
         * Prevent abbreviations to keep variable names clear and readable. Has autofix.
         * Can be extended with allowed abbreviations, auto replacements  and property/variable/filename exceptions.
         */
        'unicorn/prevent-abbreviations': 'off',
        /*
         * 'unicorn/prevent-abbreviations': [
         *   'warn',
         *   {
         *     // List of allowed abbreviations and their 'ucfirst'-variant.
         *     allowList: Object.fromEntries(
         *       Object.entries({
         *         dev: true,
         *         dir: true,
         *         dst: true,
         *         fn: true,
         *         param: true,
         *         prev: true,
         *         src: true,
         *       }).flatMap(([key, value]) => [
         *         [key, value],
         *         [key[0].toUpperCase() + key.slice(1), value],
         *       ]),
         *     ),
         *   },
         * ],
         */
      },
    },

    /*
     * ──────────────────────────────────────────────────
     * MARK: JSDoc.
     * ──────────────────────────────────────────────────
     */

    {
      name: 'jsdoc',
      files: allJsEcosystemFilePatterns,

      plugins: {
        jsdoc,
      },

      rules: {
        'jsdoc/check-param-names': [
          'warn',
          {
            checkDestructured: false,
          },
        ],

        'jsdoc/match-description': [
          'warn',
          {
            mainDescription: {
              message:
                'Start with a Capital letter, end with a full stop. Max 1 empty line between paragraphs.',
              match:
                '^(((((\\n|^)[A-Z\\d\\[.+\\("\'`*-]|\\n).+)(\\.\\n)?)+|(\\n\\s?- .+\\n)+)+$',
            },
            tags: {
              param: {
                message: 'Start with a Capital letter, end with a full stop.',
                match: String.raw`/^$|[A-Z0-9\[(].*\.$/s`,
              },
              returns: {
                message: 'Start with a Capital letter, end with a full stop.',
                match: String.raw`/^$|[A-Z0-9\[(].*\.$/s`,
              },
            },
          },
        ],

        'jsdoc/require-hyphen-before-param-description': [
          'error',
          'always',
          {
            tags: {
              returns: 'never',
            },
          },
        ],

        'jsdoc/require-param-description': 'off', // We use `jsdoc/match-description` instead.

        'jsdoc/require-param-name': 'warn',

        'jsdoc/tag-lines': ['warn', 'any', { startLines: 1 }],
      },
    },

    /*
     * ──────────────────────────────────────────────────
     * MARK: Markdown.
     * https://github.com/eslint/markdown/blob/main/src/index.js
     * ──────────────────────────────────────────────────
     */

    {
      extends: [
        // @ts-ignore: Exists according to docs.
        ...markdown.configs.recommended,
      ],

      name: 'markdown',
      files: filePatterns.markdown,
    },

    {
      name: 'markdown-code-blocks',
      files: filePatterns.markdownCodeBlocks,
      rules: {
        'no-undef': 'warn',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },

    /*
     * ──────────────────────────────────────────────────
     * MARK: Misc.
     * ──────────────────────────────────────────────────
     */

    {
      name: 'sort-destructure-keys',
      files: allJsEcosystemFilePatterns,

      plugins: {
        'sort-destructure-keys': sortDestructureKeys,
      },

      rules: {
        // Autofix.
        'sort-destructure-keys/sort-destructure-keys': ['warn', { caseSensitive: false }],
      },
    },

    {
      // Disable type-aware linting on JavaScript files.
      ...tseslint.configs.disableTypeChecked,
      name: 'javascript-disable-type-checking',
      files: [...filePatterns.js, ...filePatterns.markdownCodeBlocks],
    },

    {
      ...prettierConfig,
      name: 'prettier',
    },

    // Include additional configs.
    ...(configs ?? []),
  );
};

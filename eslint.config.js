import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    name: 'ignored-global',
    ignores: [
      '**/node_modules',
      '**/*.min.cjs',
      '**/*.min.js',
      '**/*.min.mjs',
      '**/.DS_Store',
      '**/.env',
      '**/.env.*',
      '**/!.env.sample',
      '**/*.md',
      '**/package-lock.json',
      '**/pnpm-lock.yaml',
    ],
  },
  {
    ...eslint.configs.recommended,
    name: 'eslint-recommended',
  },
  {
    name: 'language-globals',
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
  {
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    name: 'typescript',
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
  {
    // disable type-aware linting on JS files
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    name: 'javascript-no-type-checking',
  },
  {
    ...prettierConfig,
    name: 'prettier',
  },
);

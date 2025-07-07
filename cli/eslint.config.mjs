import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import path from 'node:path';
import tseslint from 'typescript-eslint';

const tseslintConfig = tseslint.config(eslint.configs.recommended, tseslint.configs.recommended);

const eslintConfig = [
  {
    ignores: ['node_modules', '.github', 'tsconfig.tsbuildinfo', '**/dist/*', 'tsconfig.json', 'eslint.config.mjs'],
  },
  ...tseslintConfig,
  eslintConfigPrettier,
  eslintPluginUnicorn.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.jest,
        ...globals.browser,
        AddEventListenerOptions: 'readonly',
        EventListener: 'readonly',
      },
    },
    settings: {
      'import/resolver': {
        node: {
          paths: ['src'],
          extensions: ['.js', '.jsx', '.ts', '.d.ts', '.tsx'],
        },
        typescript: {
          project: './tsconfig.json',
        },
        alias: {
          map: [['@', path.resolve(import.meta.dirname, './src')]],
          extensions: ['.js', '.jsx', '.ts', '.d.ts', '.tsx'],
        },
      },
    },
    rules: {
      'import/no-extraneous-dependencies': 'off',
      '@typescript-eslint/keyword-spacing': 'off',
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      '@typescript-eslint/no-explicit-any': ['warn'],
      '@typescript-eslint/no-var-requires': ['warn'],
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-undef': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'import/order': [
        'warn',
        {
          alphabetize: {
            caseInsensitive: true,
            order: 'asc',
          },
          groups: ['builtin', 'external', 'index', 'sibling', 'parent', 'internal', 'type'],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['types'],
          'newlines-between': 'always',
        },
      ],
      'import/no-named-as-default-member': 'off',
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            camelCase: true,
            pascalCase: true,
            kebabCase: true,
          },
        },
      ],
      'unicorn/consistent-function-scoping': 'off',
    },
  },
];

export default eslintConfig;

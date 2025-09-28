import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginAstro from 'eslint-plugin-astro';
import importPlugin from 'eslint-plugin-import';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import path from 'node:path';
import tseslint from 'typescript-eslint';

const tseslintConfig = tseslint.config(eslint.configs.recommended, tseslint.configs.recommended);

const eslintConfig = [
  {
    ignores: [
      'node_modules',
      '.github',
      'tsconfig.tsbuildinfo',
      '**/dist/*',
      '**/public/*',
      'tsconfig.json',
      'eslint.config.mjs',
      '.astro',
      '**/_build/**',
      '**/example/**',
    ],
  },
  ...tseslintConfig,
  eslintConfigPrettier,
  eslintPluginUnicorn.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx,astro}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.jest,
        ...globals.browser,
        ...globals.node,
        AddEventListenerOptions: 'readonly',
        EventListener: 'readonly',
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        node: {
          paths: ['src'],
          extensions: ['.js', '.jsx', '.ts', '.d.ts', '.tsx', '.astro'],
        },
        typescript: {
          project: './tsconfig.json',
        },
        alias: {
          map: [['@', path.resolve(import.meta.dirname, './src')]],
          extensions: ['.js', '.jsx', '.ts', '.d.ts', '.tsx', '.astro'],
        },
      },
    },
    rules: {
      'import/no-extraneous-dependencies': 'off',
      '@typescript-eslint/keyword-spacing': 'off',
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
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

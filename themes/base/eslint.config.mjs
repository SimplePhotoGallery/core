import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginAstro from 'eslint-plugin-astro';
import globals from 'globals';
import path from 'node:path';
import tseslint from 'typescript-eslint';

const tseslintConfig = tseslint.config(eslint.configs.recommended, tseslint.configs.recommended);

export default [
  {
    ignores: ['node_modules', '.astro', '**/dist/*', '**/public/*', '**/_build/**'],
  },
  ...tseslintConfig,
  eslintConfigPrettier,
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx,astro}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [['@', path.resolve(import.meta.dirname, './src')]],
          extensions: ['.js', '.jsx', '.ts', '.d.ts', '.tsx', '.astro'],
        },
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': ['warn'],
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
];

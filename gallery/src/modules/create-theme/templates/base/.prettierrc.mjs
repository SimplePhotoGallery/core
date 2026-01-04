/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  semi: true,
  printWidth: 125,
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  endOfLine: 'lf',
  bracketSpacing: true,
  trailingComma: 'all',
  quoteProps: 'as-needed',
  bracketSameLine: true,
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};

export default config;

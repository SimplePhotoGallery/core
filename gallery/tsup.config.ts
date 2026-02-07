import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/lib/index.ts', 'src/lib/browser.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node20',
  outDir: 'dist',
  treeshake: true,
  // Copy create-theme base template into dist so it ships with the package (dist/base/)
  publicDir: 'src/modules/create-theme/templates',
  external: [
    '@simple-photo-gallery/theme-modern',
    '@simple-photo-gallery/common',
    'blurhash',
    'commander',
    'exifreader',
    'node-ffprobe',
    'sharp',
    'zod',
  ],
});

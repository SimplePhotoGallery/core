import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/lib/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node20',
  outDir: 'dist',
  treeshake: true,
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

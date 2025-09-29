import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node20',
  outDir: 'dist',
  treeshake: true,
  external: ['@simple-photo-gallery/theme-modern', 'blurhash', 'commander', 'exifreader', 'node-ffprobe', 'sharp', 'zod'],
});

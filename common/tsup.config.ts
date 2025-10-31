import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/gallery.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node20',
  outDir: 'dist',
  treeshake: true,
  external: ['zod'],
});

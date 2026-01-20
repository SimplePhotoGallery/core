import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry point: types + schemas (no heavy deps)
  {
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
  },
  // Theme entry point: server-side utilities
  {
    entry: ['src/theme.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    minify: false,
    target: 'node20',
    outDir: 'dist',
    treeshake: true,
    external: ['zod', 'marked'],
  },
  // Client entry point: browser-side utilities (PhotoSwipe plugin, blurhash)
  {
    entry: ['src/client.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    treeshake: true,
    external: ['photoswipe', 'photoswipe/lightbox', 'blurhash'],
  },
]);

import { preventEmptyContentFiles } from '@simple-photo-gallery/common/theme';
import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-relative-links';


// Dynamically import gallery.json from source path or fallback to local
const sourceGalleryPath = process.env.GALLERY_JSON_PATH;
if (!sourceGalleryPath) throw new Error('GALLERY_JSON_PATH environment variable is not set');

const outputDir = process.env.GALLERY_OUTPUT_DIR || sourceGalleryPath.replace('gallery.json', '');

// https://astro.build/config
export default defineConfig({
  output: 'static',
  outDir: outputDir + '/_build',
  build: {
    assets: 'assets',
    assetsPrefix: 'gallery',
  },
  integrations: [relativeLinks(), preventEmptyContentFiles()],
  publicDir: 'public',
  vite: {
    define: {
      'process.env.GALLERY_JSON_PATH': JSON.stringify(sourceGalleryPath),
    },
    build: {
      // Merge all CSS into a single file instead of code-splitting
      cssCodeSplit: false,
      // Rollup options to minimize output files
      rollupOptions: {
        output: {
          // Consolidate JS chunks to minimize files
          manualChunks: undefined,
        },
      },
    },
  },
});

import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-relative-links';

// Dynamically import gallery.json from source path or fallback to local
const sourceGalleryPath = process.env.GALLERY_JSON_PATH || './gallery.json';
if (!sourceGalleryPath) throw new Error('GALLERY_JSON_PATH environment variable is not set');

const outputDir = process.env.GALLERY_OUTPUT_DIR || sourceGalleryPath.replace('gallery.json', '');

// https://astro.build/config
export default defineConfig({
  output: 'static',
  outDir: outputDir + '/_build',
  build: {
    assets: 'simple-photo-gallery-assets',
    assetsPrefix: 'gallery',
  },
  integrations: [relativeLinks()],
  publicDir: 'public',
  vite: {
    define: {
      'process.env.GALLERY_JSON_PATH': JSON.stringify(sourceGalleryPath),
    },
  },
});

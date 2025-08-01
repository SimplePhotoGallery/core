import fs from 'node:fs';

import relativeLinks from 'astro-relative-links';
import { defineConfig } from 'astro/config';

// Dynamically import gallery.json from source path or fallback to local
const sourceGalleryPath = process.env.GALLERY_JSON_PATH;
const galleryConfig =
  sourceGalleryPath && fs.existsSync(sourceGalleryPath)
    ? JSON.parse(fs.readFileSync(sourceGalleryPath, 'utf8'))
    : JSON.parse(fs.readFileSync('./gallery.json', 'utf8'));

// https://astro.build/config
export default defineConfig({
  output: 'static',
  outDir: galleryConfig.outputDir + '/_build',
  build: {
    assets: 'gallery/simple-photo-gallery-assets',
  },
  integrations: [relativeLinks()],
  publicDir: 'public',
  vite: {
    define: {
      'process.env.GALLERY_JSON_PATH': JSON.stringify(sourceGalleryPath || './gallery.json'),
    },
  },
});

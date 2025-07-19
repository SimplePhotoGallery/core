import fs from 'node:fs';

import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-relative-links';

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
    assets: 'simple-photo-gallery-assets',
  },
  integrations: [relativeLinks()],
  publicDir: 'public', //when developing, use public-dev dir to serve assets as public will be included in the build
  vite: {
    define: {
      'process.env.GALLERY_JSON_PATH': JSON.stringify(sourceGalleryPath || './gallery.json'),
    },
  },
});

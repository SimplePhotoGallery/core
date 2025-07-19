import { defineConfig } from 'astro/config';
// @ts-check
import relativeLinks from 'astro-relative-links';

import galleryConfig from './gallery.json';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  outDir: galleryConfig.outputDir + '/_build',
  build: {
    assets: 'simple-photo-gallery-assets',
  },
  integrations: [relativeLinks()],
  publicDir: 'public', //when developing, use public-dev dir to serve assets as public will be included in the build
});

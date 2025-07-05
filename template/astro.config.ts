import { defineConfig } from 'astro/config';
// @ts-check
import relativeLinks from 'astro-relative-links';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [relativeLinks()],
});

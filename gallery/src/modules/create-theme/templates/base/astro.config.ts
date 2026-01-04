import fs from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-relative-links';

import type { AstroIntegration } from 'astro';

// Dynamically import gallery.json from source path or fallback to local
const sourceGalleryPath = process.env.GALLERY_JSON_PATH;
if (!sourceGalleryPath) throw new Error('GALLERY_JSON_PATH environment variable is not set');

const outputDir = process.env.GALLERY_OUTPUT_DIR || sourceGalleryPath.replace('gallery.json', '');

/**
 * Astro integration to prevent empty content collection files from being generated
 */
function preventEmptyContentFiles(): AstroIntegration {
  return {
    name: 'prevent-empty-content-files',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const filesToRemove = ['content-assets.mjs', 'content-modules.mjs'];
        for (const fileName of filesToRemove) {
          const filePath = path.join(dir.pathname, fileName);
          if (fs.existsSync(filePath)) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              if (content.trim() === 'export default new Map();' || content.trim() === '') {
                fs.unlinkSync(filePath);
              }
            } catch {
              // Silently ignore errors
            }
          }
        }
      },
    },
  };
}

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
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
});

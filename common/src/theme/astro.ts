import fs from 'node:fs';
import path from 'node:path';

/** Astro integration type (simplified to avoid astro dependency in common) */
interface AstroIntegration {
  name: string;
  hooks: {
    'astro:build:done': (options: { dir: URL }) => void;
  };
}

/**
 * Astro integration to prevent empty content collection files from being generated.
 * Removes empty content-assets.mjs and content-modules.mjs files after build.
 */
export function preventEmptyContentFiles(): AstroIntegration {
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

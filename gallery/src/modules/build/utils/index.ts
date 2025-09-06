import path from 'node:path';

/** __dirname workaround for ESM modules. */
const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * Resolves a path relative to the current directory of this module.
 *
 * @param segments - Path segments to resolve
 * @returns Absolute path resolved from the current directory
 */
export function resolveFromCurrentDir(...segments: string[]): string {
  return path.resolve(__dirname, ...segments);
}

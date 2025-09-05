import path from 'node:path';

/**
 * __dirname workaround for ESM modules.
 * In ES modules, __dirname is not available, so we derive it from import.meta.url.
 */
const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * Helper function to resolve paths relative to the current file.
 * @param segments - Path segments to join and resolve
 * @returns The resolved absolute path
 */
export function resolveFromCurrentDir(...segments: string[]): string {
  return path.resolve(__dirname, ...segments);
}

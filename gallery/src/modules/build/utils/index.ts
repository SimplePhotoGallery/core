import path from 'node:path';

/**
 * Directory name of the current module (ESM workaround).
 */
const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * Resolve a path relative to the current directory.
 *
 * @param segments - Path segments to resolve.
 * @returns Resolved absolute path.
 */
export function resolveFromCurrentDir(...segments: string[]): string {
  return path.resolve(__dirname, ...segments);
}

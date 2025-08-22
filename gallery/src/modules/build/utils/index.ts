import path from 'node:path';

// __dirname workaround for ESM modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Helper function to resolve paths relative to current file
export const resolveFromCurrentDir = (...segments: string[]): string => {
  return path.resolve(__dirname, ...segments);
};

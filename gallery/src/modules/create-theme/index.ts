import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import type { CreateThemeOptions } from './types';
import type { CommandResultSummary } from '../telemetry/types';
import type { ConsolaInstance } from 'consola';

/**
 * Find the nearest ancestor directory (including the starting directory) that looks like a monorepo root
 * by checking for a package.json with a "workspaces" field.
 *
 * This avoids surprising behavior when the CLI is executed from within a workspace package (e.g. ./gallery),
 * but the user expects themes to be created under the monorepo root (e.g. ./themes).
 */
function findMonorepoRoot(startDir: string): string | undefined {
  let dir = path.resolve(startDir);

  while (true) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { workspaces?: unknown };
        if (pkg && typeof pkg === 'object' && 'workspaces' in pkg) {
          return dir;
        }
      } catch {
        // Ignore JSON parse errors and continue searching upwards
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

/**
 * Validates the theme name
 * @param name - Theme name to validate
 * @returns true if valid, throws error if invalid
 */
function validateThemeName(name: string): boolean {
  if (!name || name.trim().length === 0) {
    throw new Error('Theme name cannot be empty');
  }

  // Check for invalid characters (basic validation)
  if (!/^[a-z0-9-]+$/i.test(name)) {
    throw new Error('Theme name can only contain letters, numbers, and hyphens');
  }

  return true;
}

/**
 * Creates a directory if it doesn't exist
 * @param dirPath - Path to create
 * @param ui - ConsolaInstance for logging
 */
async function ensureDirectory(dirPath: string, ui: ConsolaInstance): Promise<void> {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    ui.debug(`Created directory: ${dirPath}`);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }
}

/**
 * Files and directories to exclude when copying the base theme
 */
const EXCLUDE_PATTERNS = ['node_modules', '.astro', 'dist', '_build', '.git', '*.log', '.DS_Store'];

/**
 * Check if a file or directory should be excluded
 */
function shouldExclude(name: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => {
    if (pattern.includes('*')) {
      const regexPattern = pattern.split('*').join('.*');
      const regex = new RegExp(regexPattern);
      return regex.test(name);
    }
    return name === pattern;
  });
}

/**
 * Copy a directory recursively, excluding certain files and directories
 * @param src - Source directory path
 * @param dest - Destination directory path
 * @param ui - ConsolaInstance for logging
 */
async function copyDirectory(src: string, dest: string, ui: ConsolaInstance): Promise<void> {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldExclude(entry.name)) {
      ui.debug(`Skipping excluded file/directory: ${entry.name}`);
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, ui);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
      ui.debug(`Copied file: ${destPath}`);
    }
  }
}

/**
 * Find the base theme directory path
 * Looks for templates/base relative to this module, with fallback to workspace themes/base for development
 */
function findBaseThemePath(): string {
  // Primary: Look for templates bundled with the package (for npm users)
  // When installed from npm: dist/modules/create-theme/index.js -> src/modules/create-theme/templates/base
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const bundledTemplatePath = path.resolve(moduleDir, '../../../src/modules/create-theme/templates/base');

  if (fs.existsSync(bundledTemplatePath)) {
    return bundledTemplatePath;
  }

  // Fallback: Try to find from workspace root (for local development)
  // This allows developers to modify themes/base and test changes
  const monorepoRoot = findMonorepoRoot(process.cwd());
  const workspaceRoot = monorepoRoot ?? process.cwd();
  const workspaceBaseThemePath = path.join(workspaceRoot, 'themes', 'base');

  if (fs.existsSync(workspaceBaseThemePath)) {
    return workspaceBaseThemePath;
  }

  throw new Error(
    `Base theme template not found. Tried:\n  - ${bundledTemplatePath}\n  - ${workspaceBaseThemePath}\n\nPlease ensure the templates are included in the package or themes/base exists in the workspace.`,
  );
}

/**
 * Update package.json with the new theme name
 * @param themeDir - Theme directory path
 * @param themeName - New theme name
 * @param ui - ConsolaInstance for logging
 */
async function updatePackageJson(themeDir: string, themeName: string, ui: ConsolaInstance): Promise<void> {
  const packageJsonPath = path.join(themeDir, 'package.json');
  const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent) as { name?: string };
  packageJson.name = themeName;
  await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  ui.debug(`Updated package.json with theme name: ${themeName}`);
}

/**
 * Update README.md with the new theme name
 * @param themeDir - Theme directory path
 * @param themeName - New theme name
 * @param ui - ConsolaInstance for logging
 */
async function updateReadme(themeDir: string, themeName: string, ui: ConsolaInstance): Promise<void> {
  const readmePath = path.join(themeDir, 'README.md');
  let readme = await fs.promises.readFile(readmePath, 'utf8');

  // Replace theme name references
  // Replace "# base Theme" with "# {themeName} Theme"
  readme = readme.replace(/^# base Theme$/m, `# ${themeName} Theme`);

  // Replace "./themes/base" with "./themes/{themeName}"
  readme = readme.split('./themes/base').join(`./themes/${themeName}`);

  // Replace "theme-base" with "theme-{themeName}"
  readme = readme.split('theme-base').join(`theme-${themeName}`);

  await fs.promises.writeFile(readmePath, readme, 'utf8');
  ui.debug(`Updated README.md with theme name: ${themeName}`);
}

/**
 * Main function to create a new theme
 * @param options - Options for creating the theme
 * @param ui - ConsolaInstance for logging
 * @returns CommandResultSummary
 */
export async function createTheme(options: CreateThemeOptions, ui: ConsolaInstance): Promise<CommandResultSummary> {
  try {
    // Validate theme name
    validateThemeName(options.name);

    // Determine theme directory path
    let themeDir: string;
    if (options.path) {
      // If a custom path is provided, use it as-is
      themeDir = path.resolve(options.path);
    } else {
      // Default: create in ./themes/<name> directory
      const monorepoRoot = findMonorepoRoot(process.cwd());
      const baseDir = monorepoRoot ?? process.cwd();
      const themesBaseDir = path.resolve(baseDir, 'themes');
      themeDir = path.join(themesBaseDir, options.name);

      // Ensure the themes base directory exists (but don't overwrite anything)
      if (!fs.existsSync(themesBaseDir)) {
        await ensureDirectory(themesBaseDir, ui);
      }
    }

    // Check if directory already exists - prevent overwriting existing themes
    if (fs.existsSync(themeDir)) {
      throw new Error(`Theme directory already exists: ${themeDir}. Cannot overwrite existing theme.`);
    }

    ui.start(`Creating theme: ${options.name}`);

    // Find the base theme directory
    const baseThemePath = findBaseThemePath();
    ui.debug(`Using base theme from: ${baseThemePath}`);

    // Copy entire base theme directory
    ui.debug('Copying base theme files...');
    await copyDirectory(baseThemePath, themeDir, ui);

    // Update theme-specific files
    ui.debug('Updating theme-specific files...');
    await updatePackageJson(themeDir, options.name, ui);
    await updateReadme(themeDir, options.name, ui);

    ui.success(`Theme created successfully at: ${themeDir}`);
    ui.info(`\nNext steps:`);
    ui.info(`1. cd ${themeDir}`);
    ui.info(`2. yarn install`);
    ui.info(`3. Customize your theme in src/pages/index.astro`);
    ui.info(`4. Initialize a gallery (run from directory with your images): spg init -p <images-folder>`);
    ui.info(`5. Build a gallery with your theme: spg build --theme ${themeDir} -g <gallery-folder>`);

    return { processedGalleryCount: 0 };
  } catch (error) {
    if (error instanceof Error) {
      ui.error(error.message);
    } else {
      ui.error('Failed to create theme');
    }
    throw error;
  }
}

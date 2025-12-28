import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import * as templates from './templates';

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
 * Writes a file with content
 * @param filePath - Path to the file
 * @param content - Content to write
 * @param ui - ConsolaInstance for logging
 */
async function writeFile(filePath: string, content: string, ui: ConsolaInstance): Promise<void> {
  await fs.promises.writeFile(filePath, content, 'utf8');
  ui.debug(`Created file: ${filePath}`);
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

    // Create directory structure
    await ensureDirectory(themeDir, ui);
    await ensureDirectory(path.join(themeDir, 'src'), ui);
    await ensureDirectory(path.join(themeDir, 'src', 'pages'), ui);
    await ensureDirectory(path.join(themeDir, 'src', 'layouts'), ui);
    await ensureDirectory(path.join(themeDir, 'src', 'components'), ui);
    await ensureDirectory(path.join(themeDir, 'src', 'lib'), ui);
    await ensureDirectory(path.join(themeDir, 'src', 'utils'), ui);
    await ensureDirectory(path.join(themeDir, 'public'), ui);

    // Generate all files
    ui.debug('Generating theme files...');

    // Root files
    await writeFile(path.join(themeDir, 'package.json'), templates.getPackageJson(options.name), ui);
    await writeFile(path.join(themeDir, 'astro.config.ts'), templates.getAstroConfig(), ui);
    await writeFile(path.join(themeDir, 'tsconfig.json'), templates.getTsConfig(), ui);
    await writeFile(path.join(themeDir, 'eslint.config.mjs'), templates.getEslintConfig(), ui);
    await writeFile(path.join(themeDir, '.prettierrc.mjs'), templates.getPrettierConfig(), ui);
    await writeFile(path.join(themeDir, '.prettierignore'), templates.getPrettierIgnore(), ui);
    await writeFile(path.join(themeDir, '.gitignore'), templates.getGitIgnore(), ui);
    await writeFile(path.join(themeDir, 'README.md'), templates.getReadme(options.name), ui);

    // Layout files
    await writeFile(path.join(themeDir, 'src', 'layouts', 'MainHead.astro'), templates.getMainHead(), ui);
    await writeFile(path.join(themeDir, 'src', 'layouts', 'MainLayout.astro'), templates.getMainLayout(), ui);

    // Component files
    await writeFile(path.join(themeDir, 'src', 'components', 'Hero.astro'), templates.getHeroComponent(), ui);

    // Page files
    await writeFile(path.join(themeDir, 'src', 'pages', 'index.astro'), templates.getIndexPage(), ui);

    // Library files
    await writeFile(path.join(themeDir, 'src', 'lib', 'markdown.ts'), templates.getMarkdownLib(), ui);
    await writeFile(
      path.join(themeDir, 'src', 'lib', 'photoswipe-video-plugin.ts'),
      templates.getPhotoswipeVideoPlugin(),
      ui,
    );

    // Utility files
    await writeFile(path.join(themeDir, 'src', 'utils', 'index.ts'), templates.getUtilsIndex(), ui);

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

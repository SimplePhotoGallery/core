import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
// __dirname workaround for ESM modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Helper function to resolve paths relative to current file
function resolveFromCurrentDir(...segments: string[]): string {
  return path.resolve(__dirname, ...segments);
}

// Helper to get project root (4 levels up from cli/src/modules/setup-template)
function getProjectRoot(): string {
  return resolveFromCurrentDir('../../../../');
}

function findGalleryJsons(basePath: string, recursive: boolean): string[] {
  const foundDirs: string[] = [];
  function search(dir: string) {
    const galleryJsonPath = path.join(dir, 'gallery', 'gallery.json');
    if (fs.existsSync(galleryJsonPath)) {
      foundDirs.push(dir);
    }
    if (recursive) {
      let entries: string[] = [];
      try {
        entries = fs.readdirSync(dir);
      } catch {
        return;
      }
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          search(fullPath);
        }
      }
    }
  }
  if (recursive) {
    search(basePath);
  } else {
    // Check basePath itself
    const galleryJsonPath = path.join(basePath, 'gallery', 'gallery.json');
    if (fs.existsSync(galleryJsonPath)) {
      foundDirs.push(basePath);
    }
    // Check direct subfolders
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(basePath);
    } catch {
      return foundDirs;
    }
    for (const entry of entries) {
      const fullPath = path.join(basePath, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        const subGalleryJson = path.join(fullPath, 'gallery', 'gallery.json');
        if (fs.existsSync(subGalleryJson)) {
          foundDirs.push(fullPath);
        }
      }
    }
  }
  return foundDirs;
}

function processGalleryJson(galleryDir: string, templateDir: string) {
  const galleryJsonPath = path.join(galleryDir, 'gallery', 'gallery.json');
  if (!fs.existsSync(galleryJsonPath)) {
    console.log(`No gallery/gallery.json found in ${galleryDir}`);
    return;
  }

  // 1. Set environment variable for gallery.json path instead of copying
  const originalEnv = { ...process.env };
  process.env.GALLERY_JSON_PATH = galleryJsonPath;

  // 2. Modify/add outputDir property in the source gallery.json
  let galleryConfig;
  try {
    galleryConfig = JSON.parse(fs.readFileSync(galleryJsonPath, 'utf8'));
  } catch {
    console.error(`Failed to parse gallery.json in ${galleryDir}`);
    return;
  }
  // Set outputDir to the gallery subfolder
  galleryConfig.outputDir = path.join(galleryDir, 'gallery');
  fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryConfig, null, 2));

  // 3. Run npm run build in template directory
  try {
    execSync('npm run build', { cwd: templateDir, stdio: 'inherit' });
  } catch {
    console.error(`Build failed for ${galleryDir}`);
    return;
  } finally {
    // Restore original environment
    process.env = originalEnv;
  }

  // 4. Copy everything from _build to outputDir
  const buildDir = path.join(galleryConfig.outputDir, '_build');
  if (!fs.existsSync(buildDir)) {
    console.error(`Build output directory not found: ${buildDir}`);
    return;
  }
  const outputDir = path.join(galleryConfig.outputDir);
  const buildEntries = fs.readdirSync(buildDir);
  for (const entry of buildEntries) {
    const src = path.join(buildDir, entry);
    const dest = path.join(outputDir, entry);
    // Remove existing if present
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    // Copy file or directory
    if (fs.statSync(src).isDirectory()) {
      copyDirSync(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  // 5. Clean up the _build directory
  console.log('Cleaning up build directory...');
  fs.rmSync(buildDir, { recursive: true, force: true });
}

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export async function setupTemplate(options: { path: string; recursive: boolean }): Promise<void> {
  const { path: imagesPath, recursive } = options;
  const templateDir = path.join(getProjectRoot(), 'template');
  const galleryDirs = findGalleryJsons(imagesPath, recursive);
  if (galleryDirs.length === 0) {
    console.log('No gallery/gallery.json files found.');
    return;
  }
  for (const dir of galleryDirs) {
    processGalleryJson(dir, templateDir);
  }
}

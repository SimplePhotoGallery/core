import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { DEFAULT_PUBLIC_DIR_CONFIG } from './consts/config';

import type { PublicDirConfig, SetupOptions } from './types';
import type { GalleryData } from '../../types';

async function createSymbolicLinks(
  externalImagePath: string,
  publicImagesPath: string,
  publicThumbnailsPath: string,
  galleryData: GalleryData,
  cliGalleryPath: string,
  copyFallback: boolean = false,
): Promise<void> {
  try {
    await fs.mkdir(publicImagesPath, { recursive: true });
    await fs.mkdir(publicThumbnailsPath, { recursive: true });

    const cleanSymlinks = async (dirPath: string) => {
      try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = await fs.lstat(filePath);
          if (stats.isSymbolicLink()) {
            await fs.unlink(filePath);
          }
        }
      } catch {
        // Directory might not exist, which is fine
      }
    };

    await cleanSymlinks(publicImagesPath);
    await cleanSymlinks(publicThumbnailsPath);

    const allFiles = await fs.readdir(externalImagePath);
    const mediaFiles = allFiles.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp)$/i.test(file),
    );

    // Windows-compatible linking function
    const createLink = async (sourcePath: string, linkPath: string, fileName: string): Promise<boolean> => {
      try {
        if (process.platform === 'win32') {
          // On Windows, try symbolic link first, then junction point
          try {
            await fs.symlink(sourcePath, linkPath);
            console.log(`🔗 Linked: ${fileName}`);
            return true;
          } catch {
            // If symbolic link fails, try using mklink command (requires admin privileges)
            try {
              execSync(`mklink "${linkPath}" "${sourcePath}"`, { shell: 'cmd' });
              console.log(`🔗 Linked (mklink): ${fileName}`);
              return true;
            } catch {
              if (copyFallback) {
                // Copy file as fallback
                await fs.copyFile(sourcePath, linkPath);
                console.log(`📋 Copied: ${fileName}`);
                return true;
              } else {
                console.warn(`⚠️  Could not create link for ${fileName}: Requires administrator privileges`);
                console.warn(`💡 Run as administrator, enable Developer Mode, or use --copy-fallback`);
                return false;
              }
            }
          }
        } else {
          // Unix-like systems
          try {
            await fs.symlink(sourcePath, linkPath);
            console.log(`🔗 Linked: ${fileName}`);
            return true;
          } catch (error) {
            if (copyFallback) {
              // Copy file as fallback
              await fs.copyFile(sourcePath, linkPath);
              console.log(`📋 Copied: ${fileName}`);
              return true;
            } else {
              console.warn(`⚠️  Could not link ${fileName}: ${error}`);
              return false;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not link ${fileName}: ${error}`);
        return false;
      }
    };

    let linkedCount = 0;
    for (const file of mediaFiles) {
      const sourcePath = path.join(externalImagePath, file);
      const linkPath = path.join(publicImagesPath, file);
      const success = await createLink(sourcePath, linkPath, file);
      if (success) linkedCount++;
    }

    // Extract thumbnail paths from gallery data instead of hardcoding
    const thumbnailPaths = new Set<string>();
    for (const section of galleryData.sections) {
      for (const image of section.images) {
        if (image.thumbnail?.path) {
          thumbnailPaths.add(image.thumbnail.path);
        }
      }
    }

    // Get the directory where gallery.json is located to calculate relative paths
    const galleryDir = path.dirname(cliGalleryPath);

    for (const thumbnailPath of thumbnailPaths) {
      try {
        // Calculate the full path to the thumbnail file relative to the gallery directory
        const fullThumbnailPath = path.join(galleryDir, thumbnailPath);
        const thumbnailFileName = path.basename(thumbnailPath);
        const linkPath = path.join(publicThumbnailsPath, thumbnailFileName);

        const success = await createLink(fullThumbnailPath, linkPath, `thumbnail: ${thumbnailFileName}`);
        if (success) linkedCount++;
      } catch (error) {
        console.warn(`⚠️  Could not link thumbnail ${thumbnailPath}: ${error}`);
      }
    }

    console.log(`✅ Successfully set up external media links!`);
    console.log(`📁 Media files: ${publicImagesPath}`);
    console.log(`📁 Thumbnails: ${publicThumbnailsPath}`);
    console.log(`📊 Total files linked: ${linkedCount}`);

    if (process.platform === 'win32' && linkedCount === 0 && !copyFallback) {
      console.log(`\n💡 Windows Tips:`);
      console.log(`   • Run the command as Administrator`);
      console.log(`   • Enable Developer Mode in Windows Settings > Update & Security > For developers`);
      console.log(`   • Or use the --copy-fallback option to copy files instead of linking`);
    }
  } catch (error) {
    throw new Error(`Error setting up external images: ${error}`);
  }
}

async function convertAndSetup(
  cliGalleryPath: string,
  outputPath: string,
  copyFallback: boolean = false,
  publicDirConfig: PublicDirConfig = DEFAULT_PUBLIC_DIR_CONFIG,
): Promise<void> {
  try {
    // Read the CLI-generated gallery JSON (source of truth)
    const cliGalleryContent = await fs.readFile(cliGalleryPath, 'utf8');
    const cliGallery: GalleryData = JSON.parse(cliGalleryContent);

    // Extract external image path from the first image path
    let externalImagePath: string;
    if (cliGallery.sections.length > 0 && cliGallery.sections[0].images.length > 0) {
      const firstImagePath = cliGallery.sections[0].images[0].path;
      externalImagePath = path.dirname(firstImagePath);
    } else {
      throw new Error('No images found in gallery.json to determine external image path');
    }

    // Extract template directory from output path
    const templateDir = path.dirname(outputPath);

    // Update headerImage path to public URL
    if (cliGallery.headerImage) {
      const headerFileName = path.basename(cliGallery.headerImage);
      cliGallery.headerImage = `/${publicDirConfig.images}/${headerFileName}`;
    }

    // Update image and thumbnail paths to public URLs
    for (const section of cliGallery.sections) {
      for (const image of section.images) {
        if (image.path) {
          const fileName = path.basename(image.path);
          image.path = `/${publicDirConfig.images}/${fileName}`;
        }
        if (image.thumbnail && image.thumbnail.path) {
          const thumbName = path.basename(image.thumbnail.path);
          image.thumbnail.path = `/${publicDirConfig.thumbnails}/${thumbName}`;
        }
      }
    }

    // Write the updated gallery JSON to the template location
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(cliGallery, null, 2));

    console.log(`✅ Successfully updated template gallery.json!`);
    console.log(`📁 Input: ${cliGalleryPath}`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`🖼️  Media files referenced from: ${externalImagePath}`);
    console.log(`📊 Total media files: ${cliGallery.sections.reduce((acc, s) => acc + s.images.length, 0)}`);

    // Create symbolic links
    const publicImagesPath = path.join(templateDir, publicDirConfig.publicDir, publicDirConfig.images);
    const publicThumbnailsPath = path.join(templateDir, publicDirConfig.publicDir, publicDirConfig.thumbnails);
    await createSymbolicLinks(
      externalImagePath,
      publicImagesPath,
      publicThumbnailsPath,
      cliGallery,
      cliGalleryPath,
      copyFallback,
    );

    console.log(`\n🎉 Gallery setup complete!`);
    console.log(`📁 Public directory: ${publicDirConfig.publicDir}`);
    console.log(`🌐 Your media files will be served from /${publicDirConfig.images}/ and /${publicDirConfig.thumbnails}/`);
    console.log(`🚀 You can now run: npm run dev`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        throw new Error(`CLI gallery file not found: ${cliGalleryPath}`);
      }
      if (error.message.includes('Unexpected token')) {
        throw new Error(`Invalid JSON format in CLI gallery file: ${cliGalleryPath}`);
      }
    }
    throw new Error(`Error during setup: ${error}`);
  }
}

export async function setup(
  options: SetupOptions & { imagesDir?: string; thumbnailsDir?: string; publicDir?: string },
): Promise<void> {
  // Validate required options
  if (!options.cliGallery) {
    console.error('❌ Error: --cli-gallery option is required');
    console.log('');
    console.log('Usage:');
    console.log(
      '  gallery setup -c <cli-gallery-path> [-o <output-path>] [--public-dir <path>] [--images-dir <path>] [--thumbnails-dir <path>]',
    );
    console.log('');
    console.log('Examples:');
    console.log('  gallery setup -c ../tmp/.simple-photo-gallery/gallery.json -o ../template/gallery.json');
    console.log('  gallery setup -c ../my-photos/gallery.json -o ./gallery.json --images-dir media --thumbnails-dir thumbs');
    console.log('  gallery setup -c ../my-photos/gallery.json -o ./gallery.json --images-dir photos');
    console.log(
      '  gallery setup -c ../my-photos/gallery.json -o ./gallery.json --public-dir assets --images-dir photos --thumbnails-dir thumbs',
    );

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }

  const cliGalleryPath = path.resolve(options.cliGallery);
  const outputPath = path.resolve(options.output);

  console.log(`🚀 Setting up gallery with external images...\n`);

  try {
    await fs.access(cliGalleryPath);
    const publicDirConfig: PublicDirConfig = {
      publicDir: options.publicDir || DEFAULT_PUBLIC_DIR_CONFIG.publicDir,
      images: options.imagesDir || DEFAULT_PUBLIC_DIR_CONFIG.images,
      thumbnails: options.thumbnailsDir || DEFAULT_PUBLIC_DIR_CONFIG.thumbnails,
    };
    await convertAndSetup(cliGalleryPath, outputPath, options.copyFallback, publicDirConfig);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new Error(`CLI gallery file not found: ${cliGalleryPath}`);
    }
    throw new Error(`Error during setup: ${error}`);
  }
}

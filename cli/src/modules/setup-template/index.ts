import { promises as fs } from 'node:fs';
import path from 'node:path';

interface SetupAstroOptions {
  astroConfig: string;
  imagesPath: string;
  galleryJsonPath: string;
  mode?: 'dev' | 'prod';
}

async function copyGalleryJsonProd(galleryJsonPath: string, astroConfigPath: string): Promise<void> {
  try {
    // Get the directory where the astro config is located
    const astroConfigDir = path.dirname(astroConfigPath);
    const destinationPath = path.join(astroConfigDir, 'gallery.json');

    // Calculate relative path from astro config to gallery.json directory
    const relativeGalleryJsonPath = path.relative(astroConfigDir, path.dirname(galleryJsonPath));

    // Read the gallery.json file
    const galleryContent = await fs.readFile(galleryJsonPath, 'utf8');
    const galleryData = JSON.parse(galleryContent);

    // Add outputDir to gallery.json
    galleryData.outputDir = relativeGalleryJsonPath;

    // Add '../' prefix to headerImage
    if (galleryData.headerImage) {
      galleryData.headerImage = `../${galleryData.headerImage}`;
    }

    // Process each section and image
    if (galleryData.sections) {
      for (const section of galleryData.sections) {
        if (section.images) {
          for (const image of section.images) {
            // Add '../' prefix to image paths
            if (image.path) {
              image.path = `../${image.path}`;
            }

            // Remove '.simple-photo-gallery' from thumbnail paths
            if (image.thumbnail && image.thumbnail.path) {
              image.thumbnail.path = image.thumbnail.path.replace('.simple-photo-gallery/', '');
            }
          }
        }
      }
    }

    // Write the modified gallery.json file
    await fs.writeFile(destinationPath, JSON.stringify(galleryData, null, 2));

    console.log(`✅ Copied and modified gallery.json to: ${destinationPath}`);
  } catch (error) {
    throw new Error(`Error copying gallery.json: ${error}`);
  }
}

async function copyGalleryJsonDev(galleryJsonPath: string, astroConfigPath: string): Promise<void> {
  try {
    // Get the directory where the astro config is located
    const astroConfigDir = path.dirname(astroConfigPath);
    const destinationPath = path.join(astroConfigDir, 'gallery.json');

    // Copy gallery.json as-is
    await fs.copyFile(galleryJsonPath, destinationPath);

    console.log(`✅ Copied gallery.json to: ${destinationPath}`);
  } catch (error) {
    throw new Error(`Error copying gallery.json: ${error}`);
  }
}

async function modifyAstroConfig(astroConfigPath: string, imagesPath: string, mode: 'dev' | 'prod'): Promise<void> {
  try {
    // Read the astro config file
    const astroConfigContent = await fs.readFile(astroConfigPath, 'utf8');

    if (mode === 'dev') {
      // Calculate relative path from astro config to images directory
      const astroConfigDir = path.dirname(astroConfigPath);
      const relativeImagesPath = path.relative(astroConfigDir, imagesPath);

      // Replace the publicDir setting to point to the images path
      const modifiedContent = astroConfigContent.replace(
        /publicDir:\s*['"][^'"]*['"]/,
        `publicDir: '${relativeImagesPath}'`,
      );

      // Write the modified astro config file
      await fs.writeFile(astroConfigPath, modifiedContent);

      console.log(`✅ Modified astro.config.ts to use images path: ${relativeImagesPath}`);
    } else {
      // In prod mode, ensure publicDir is set to 'public'
      const modifiedContent = astroConfigContent.replace(/publicDir:\s*['"][^'"]*['"]/, `publicDir: 'public'`);

      // Write the modified astro config file
      await fs.writeFile(astroConfigPath, modifiedContent);

      console.log(`✅ Modified astro.config.ts to use public directory`);
    }
  } catch (error) {
    throw new Error(`Error modifying astro.config.ts: ${error}`);
  }
}

export async function setupAstro(options: SetupAstroOptions): Promise<void> {
  const mode = options.mode || 'prod'; // Default to prod mode

  // Validate required options
  if (!options.imagesPath) {
    throw new Error(
      '❌ Error: --images-path option is required\n\nUsage:\n  gallery setup-astro --images-path <path> --astro-config <path> --gallery-json <path> [--mode <dev|prod>]\n\nExamples:\n  gallery setup-astro --images-path ../my-photos --astro-config ./astro.config.ts --gallery-json ./gallery.json\n  gallery setup-astro --images-path ../my-photos --astro-config ./astro.config.ts --gallery-json ./gallery.json --mode dev',
    );
  }

  if (!options.astroConfig) {
    throw new Error(
      '❌ Error: --astro-config option is required\n\nUsage:\n  gallery setup-astro --images-path <path> --astro-config <path> --gallery-json <path> [--mode <dev|prod>]\n\nExamples:\n  gallery setup-astro --images-path ../my-photos --astro-config ./astro.config.ts --gallery-json ./gallery.json\n  gallery setup-astro --images-path ../my-photos --astro-config ./astro.config.ts --gallery-json ./gallery.json --mode dev',
    );
  }

  if (!options.galleryJsonPath) {
    throw new Error(
      '❌ Error: --gallery-json option is required\n\nUsage:\n  gallery setup-astro --images-path <path> --astro-config <path> --gallery-json <path> [--mode <dev|prod>]\n\nExamples:\n  gallery setup-astro --images-path ../my-photos --astro-config ./astro.config.ts --gallery-json ./gallery.json\n  gallery setup-astro --images-path ../my-photos --astro-config ./astro.config.ts --gallery-json ./gallery.json --mode dev',
    );
  }

  const imagesPath = path.resolve(options.imagesPath);
  const astroConfigPath = path.resolve(options.astroConfig);
  const galleryJsonPath = path.resolve(options.galleryJsonPath);

  console.log(`🚀 Setting up Astro config for external images in ${mode} mode...\n`);

  try {
    // Verify all paths exist
    await fs.access(imagesPath);
    await fs.access(astroConfigPath);
    await fs.access(galleryJsonPath);

    console.log(`📁 Images Path: ${imagesPath}`);
    console.log(`📁 Astro Config: ${astroConfigPath}`);
    console.log(`📁 Gallery JSON: ${galleryJsonPath}`);
    console.log(`🔧 Mode: ${mode}`);

    // Copy gallery.json based on mode
    await (mode === 'dev'
      ? copyGalleryJsonDev(galleryJsonPath, astroConfigPath)
      : copyGalleryJsonProd(galleryJsonPath, astroConfigPath));

    // Modify astro.config.ts
    await modifyAstroConfig(astroConfigPath, imagesPath, mode);

    console.log(`\n🎉 Astro setup complete in ${mode} mode!`);
    if (mode === 'dev') {
      console.log(`📄 Gallery.json has been copied as-is`);
      console.log(`🔧 Astro config modified to point to images directory`);
    } else {
      console.log(`📄 Gallery.json has been copied and modified with outputDir`);
      console.log(`🔧 Astro config modified to use public directory`);
    }
    console.log(`🚀 You can now run: npm run dev`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      let errorMessage = '';
      if (error.message.includes(imagesPath)) {
        errorMessage = `Images path not found: ${imagesPath}`;
      } else if (error.message.includes(astroConfigPath)) {
        errorMessage = `Astro config file not found: ${astroConfigPath}`;
      } else if (error.message.includes(galleryJsonPath)) {
        errorMessage = `Gallery JSON file not found: ${galleryJsonPath}`;
      }
      throw new Error(errorMessage);
    }
    throw new Error(`Error during Astro setup: ${error}`);
  }
}

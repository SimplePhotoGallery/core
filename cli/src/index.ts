#!/usr/bin/env node

import { Command } from "commander";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import ffprobe from "node-ffprobe";

const program = new Command();

program.name("gallery").description("Simple Photo Gallery CLI").version("0.0.1");

// Image extensions
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.svg'
]);

// Video extensions
const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'
]);

interface MediaFile {
  name: string;
  path: string;
  width: number;
  height: number;
  type: 'image' | 'video';
}

async function getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (error) {
    console.warn(`Warning: Could not get dimensions for image ${filePath}:`, error);
    return { width: 0, height: 0 };
  }
}

async function getVideoDimensions(filePath: string): Promise<{ width: number; height: number }> {
  try {
    const data = await ffprobe(filePath);
    const videoStream = data.streams.find(stream => stream.codec_type === 'video');
    if (videoStream) {
      return {
        width: videoStream.width || 0,
        height: videoStream.height || 0
      };
    }
    return { width: 0, height: 0 };
  } catch (error) {
    console.warn(`Warning: Could not get dimensions for video ${filePath}:`, error);
    return { width: 0, height: 0 };
  }
}

function isMediaFile(fileName: string): 'image' | 'video' | null {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}

async function scanDirectory(dirPath: string, recursive: boolean = false): Promise<MediaFile[]> {
  const mediaFiles: MediaFile[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory() && recursive) {
        const subDirFiles = await scanDirectory(fullPath, recursive);
        mediaFiles.push(...subDirFiles);
      } else if (entry.isFile()) {
        const mediaType = isMediaFile(entry.name);
        if (mediaType) {
          console.log(`Processing ${mediaType}: ${entry.name}`);
          
          let dimensions = { width: 0, height: 0 };
          
          if (mediaType === 'image') {
            dimensions = await getImageDimensions(fullPath);
          } else if (mediaType === 'video') {
            dimensions = await getVideoDimensions(fullPath);
          }
          
          mediaFiles.push({
            name: entry.name,
            path: fullPath,
            width: dimensions.width,
            height: dimensions.height,
            type: mediaType
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return mediaFiles;
}

program
  .command("init")
  .description("Initialize a new gallery project")
  .action(() => {
    console.log("Hello from gallery init!");
  });

program
  .command("build")
  .description("Build the gallery project")
  .action(() => {
    console.log("Hello from gallery build!");
  });

program
  .command("sync")
  .description("Scan directory for images and videos and create gallery.json")
  .option("-p, --path <path>", "Path to scan for media files", process.cwd())
  .option("-o, --output <path>", "Output directory for gallery.json", "")
  .option("-r, --recursive", "Scan subdirectories recursively", false)
  .action(async (options: { path: string; output: string; recursive: boolean }) => {
    const scanPath = path.resolve(options.path);
    const outputPath = options.output ? path.resolve(options.output) : scanPath;
    const galleryJsonPath = path.join(outputPath, "gallery.json");
    
    console.log(`Scanning directory: ${scanPath}`);
    console.log(`Output directory: ${outputPath}`);
    console.log(`Recursive: ${options.recursive}`);
    
    try {
      // Ensure scan path exists
      await fs.access(scanPath);
      
      // Ensure output directory exists
      await fs.mkdir(outputPath, { recursive: true });
      
      // Scan for media files
      const mediaFiles = await scanDirectory(scanPath, options.recursive);
      
      console.log(`Found ${mediaFiles.length} media files`);
      
      // Create gallery.json
      const galleryData = {
        scanned_at: new Date().toISOString(),
        scan_path: scanPath,
        recursive: options.recursive,
        total_files: mediaFiles.length,
        files: mediaFiles
      };
      
      await fs.writeFile(galleryJsonPath, JSON.stringify(galleryData, null, 2));
      
      console.log(`Gallery JSON created at: ${galleryJsonPath}`);
      console.log(`Total files processed: ${mediaFiles.length}`);
      
    } catch (error) {
      console.error("Error during sync:", error);
      process.exit(1);
    }
  });

program.parse();

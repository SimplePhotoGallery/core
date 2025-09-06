import type { MediaFile } from '../../../types';

/**
 * Type representing supported media file types.
 */
export type MediaFileType = 'image' | 'video';

/**
 * Options for the `init` command.
 */
export interface ScanOptions {
  /** Path to the folder containing the photos. */
  photos: string;
  /** Optional path where the gallery will be initialized. */
  gallery?: string;
  /** Whether to scan subdirectories recursively. */
  recursive: boolean;
  /** Use default gallery settings instead of prompting the user. */
  default: boolean;
}

/**
 * Description of a generated sub‑gallery.
 */
export interface SubGallery {
  /** Title of the sub-gallery. */
  title: string;
  /** Path to the header image. */
  headerImage: string;
  /** Relative path to the sub-gallery directory. */
  path: string;
}

/**
 * Result of scanning a single directory for media files and sub-galleries.
 */
export interface ScanDirectoryResult {
  /** Found media files. */
  mediaFiles: MediaFile[];
  /** Directories containing potential sub-galleries. */
  subGalleryDirectories: string[];
}

/**
 * Aggregated result of processing a directory tree.
 */
export interface ProcessDirectoryResult {
  /** Total number of media files found. */
  totalFiles: number;
  /** Total number of galleries created. */
  totalGalleries: number;
  /** Optional sub-gallery generated for the directory. */
  subGallery?: SubGallery;
}

/**
 * Gallery settings entered by the user.
 */
export interface GallerySettingsFromUser {
  /** Title for the gallery. */
  title: string;
  /** Description of the gallery. */
  description: string;
  /** Header image path. */
  headerImage: string;
  /** Size of generated thumbnails in pixels. */
  thumbnailSize: number;
}

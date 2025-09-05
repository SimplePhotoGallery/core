import type { MediaFile } from '../../../types';

/**
 * Type representing the type of media file.
 */
export type MediaFileType = 'image' | 'video';

/**
 * Options for scanning and initializing galleries.
 * Configures the behavior of the gallery initialization process.
 */
export interface ScanOptions {
  /** Path to the folder where the photos are stored */
  photos: string;
  /** Optional path to the directory where the gallery will be initialized */
  gallery?: string;
  /** Whether to recursively create galleries from all photos subdirectories */
  recursive: boolean;
  /** Whether to use default gallery settings instead of prompting the user */
  default: boolean;
}

/**
 * Represents a sub-gallery within a main gallery.
 * Contains metadata for nested galleries.
 */
export interface SubGallery {
  /** Title of the sub-gallery */
  title: string;
  /** Path to the header image for the sub-gallery */
  headerImage: string;
  /** Relative path to the sub-gallery directory */
  path: string;
}

/**
 * Result of scanning a single directory for media files.
 * Contains discovered media files and subdirectories.
 */
export interface ScanDirectoryResult {
  /** Array of media files found in the directory */
  mediaFiles: MediaFile[];
  /** Array of subdirectory paths that could contain galleries */
  subGalleryDirectories: string[];
}

/**
 * Result of processing a directory and its subdirectories.
 * Contains statistics and sub-gallery information.
 */
export interface ProcessDirectoryResult {
  /** Total number of media files processed */
  totalFiles: number;
  /** Total number of galleries created */
  totalGalleries: number;
  /** Optional sub-gallery information if this directory becomes a sub-gallery */
  subGallery?: SubGallery;
}

/**
 * Gallery settings provided by the user during interactive setup.
 * Contains customization options for the gallery.
 */
export interface GallerySettingsFromUser {
  /** Title of the gallery */
  title: string;
  /** Description of the gallery */
  description: string;
  /** Path to the header image */
  headerImage: string;
  /** Size of thumbnails in pixels */
  thumbnailSize: number;
}

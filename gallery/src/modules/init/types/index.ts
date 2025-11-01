import type { MediaFile } from '@simple-photo-gallery/common';

/** Type for media file types supported by the gallery */
export type MediaFileType = 'image' | 'video';

/** Options for scanning directories and initializing galleries */
export interface ScanOptions {
  /** Path to the folder where photos are stored */
  photos: string;
  /** Optional path to the directory where the gallery will be initialized */
  gallery?: string;
  /** Whether to recursively create galleries from all photo subdirectories */
  recursive: boolean;
  /** Whether to use default gallery settings instead of prompting user */
  default: boolean;
  /** Whether to force override existing galleries without prompting */
  force: boolean;
}

/** Metadata for a sub-gallery */
export interface SubGallery {
  /** Title of the sub-gallery */
  title: string;
  /** Path to the header image for the sub-gallery */
  headerImage: string;
  /** Relative path to the sub-gallery directory */
  path: string;
}

/** Result of scanning a directory for media files and sub-directories */
export interface ScanDirectoryResult {
  /** Array of media files found in the directory */
  mediaFiles: MediaFile[];
  /** Array of subdirectory paths that could contain galleries */
  subGalleryDirectories: string[];
}

/** Result of processing a directory and its subdirectories */
export interface ProcessDirectoryResult {
  /** Total number of media files processed */
  totalFiles: number;
  /** Total number of galleries created */
  totalGalleries: number;
  /** Sub-gallery metadata if this directory created a gallery */
  subGallery?: SubGallery;
}

/** Gallery settings provided by the user during initialization */
export interface GallerySettingsFromUser {
  /** Title of the gallery */
  title: string;
  /** Description of the gallery */
  description: string;
  /** URL of the gallery */
  url: string;
  /** Path to the header image */
  headerImage: string;
}

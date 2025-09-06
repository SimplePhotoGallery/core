import type { MediaFile } from '../../../types';

/** Type of media file. */
export type MediaFileType = 'image' | 'video';

/** Options for scanning directories to initialize galleries. */
export interface ScanOptions {
  /** Path to the photos directory. */
  photos: string;
  /** Optional path where the gallery should be created. */
  gallery?: string;
  /** Whether to scan subdirectories recursively. */
  recursive: boolean;
  /** Use default settings without prompting the user. */
  default: boolean;
}

/** Metadata describing a sub-gallery. */
export interface SubGallery {
  /** Display title of the sub-gallery. */
  title: string;
  /** Header image for the sub-gallery. */
  headerImage: string;
  /** Relative path to the sub-gallery. */
  path: string;
}

/** Result of scanning a directory for media files. */
export interface ScanDirectoryResult {
  /** List of media files found. */
  mediaFiles: MediaFile[];
  /** Paths of subdirectories that may contain galleries. */
  subGalleryDirectories: string[];
}

/** Result of processing a directory tree. */
export interface ProcessDirectoryResult {
  /** Total number of media files processed. */
  totalFiles: number;
  /** Total number of galleries created. */
  totalGalleries: number;
  /** Optional information about the created sub-gallery. */
  subGallery?: SubGallery;
}

/** Gallery settings provided by the user. */
export interface GallerySettingsFromUser {
  /** Gallery title. */
  title: string;
  /** Gallery description. */
  description: string;
  /** Path to the header image. */
  headerImage: string;
  /** Size of generated thumbnails. */
  thumbnailSize: number;
}

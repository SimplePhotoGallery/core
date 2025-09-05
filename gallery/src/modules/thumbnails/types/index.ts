/**
 * Options for the thumbnails command.
 * Configures how thumbnails should be generated for galleries.
 */
export interface ThumbnailOptions {
  /** Path to the directory containing the gallery */
  gallery: string;
  /** Whether to scan subdirectories recursively for galleries */
  recursive: boolean;
}

/**
 * Represents the dimensions of an image or video.
 * Contains width and height measurements in pixels.
 */
export interface Dimensions {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Options for the `thumbnails` command.
 */
export interface ThumbnailOptions {
  /** Path to the gallery directory. */
  gallery: string;
  /** Whether to scan subdirectories recursively. */
  recursive: boolean;
}

/**
 * Generic width/height dimensions.
 */
export interface Dimensions {
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
}

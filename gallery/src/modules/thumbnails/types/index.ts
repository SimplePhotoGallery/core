/** Options for generating thumbnails */
export interface ThumbnailOptions {
  /** Path to the directory containing the gallery */
  gallery: string;
  /** Whether to process galleries in subdirectories recursively */
  recursive: boolean;
}

/** Represents width and height dimensions */
export interface Dimensions {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

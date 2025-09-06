/** Options for generating thumbnails. */
export interface ThumbnailOptions {
  /** Path to the gallery or root directory containing galleries. */
  gallery: string;
  /** Whether to scan directories recursively. */
  recursive: boolean;
}

/** Width and height pair. */
export interface Dimensions {
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
}

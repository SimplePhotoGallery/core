/** Options for building gallery HTML output */
export interface BuildOptions {
  /** Path to the directory containing the gallery */
  gallery: string;
  /** Whether to build galleries in subdirectories recursively */
  recursive: boolean;
  /** Optional base URL where the photos are hosted */
  baseUrl?: string;
  /** Optional base URL where the thumbnails are hosted */
  thumbsBaseUrl?: string;
  /** Scan for new photos */
  scan: boolean;
  /** Create thumbnails */
  thumbnails: boolean;
  /** Theme package name to use for building (e.g., '@simple-photo-gallery/theme-modern' or '@your-org/your-private-theme') */
  theme?: string;
  /** Override thumbnail size in pixels */
  thumbnailSize?: number;
  /** Override how thumbnail size should be applied: 'auto', 'width', or 'height' */
  thumbnailEdge?: 'auto' | 'width' | 'height';
}

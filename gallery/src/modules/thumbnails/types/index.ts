/** Options for generating thumbnails */
export interface ThumbnailOptions {
  /** Path to the directory containing the gallery */
  gallery: string;
  /** Whether to process galleries in subdirectories recursively */
  recursive: boolean;
  /** Override telemetry setting (0=disable, 1=enable) */
  telemetry?: number;
}

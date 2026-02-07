/** Options for generating thumbnails */
export interface ThumbnailOptions {
  /** Path to the directory containing the gallery */
  gallery: string;
  /** Whether to process galleries in subdirectories recursively */
  recursive: boolean;
  /** Override thumbnail size in pixels */
  thumbnailSize?: number;
  /** Override how thumbnail size should be applied: 'auto', 'width', or 'height' */
  thumbnailEdge?: 'auto' | 'width' | 'height';
}

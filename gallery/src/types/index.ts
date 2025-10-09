import type { Metadata, Sharp } from 'sharp';

/** Represents width and height dimensions */
export interface Dimensions {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

export interface ImageWithMetadata {
  image: Sharp;
  metadata: Metadata;
}

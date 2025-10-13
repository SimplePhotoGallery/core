import type { Metadata, Sharp } from 'sharp';

/** Represents width and height dimensions */
export interface Dimensions {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/** Represents an image with metadata */
export interface ImageWithMetadata {
  /** The image */
  image: Sharp;

  /** The metadata */
  metadata: Metadata;
}

/** Represents the telemetry option */
export interface TelemetryOption {
  telemetry?: '0' | '1';
}

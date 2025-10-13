/** Options for building gallery HTML output */
export interface BuildOptions {
  /** Path to the directory containing the gallery */
  gallery: string;
  /** Whether to build galleries in subdirectories recursively */
  recursive: boolean;
  /** Optional base URL where the photos are hosted */
  baseUrl?: string;
  /** Override telemetry setting (0=disable, 1=enable) */
  telemetry?: number;
}

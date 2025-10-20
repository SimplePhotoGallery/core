/** Options for building gallery HTML output */
export interface BuildOptions {
  /** Path to the directory containing the gallery */
  gallery: string;
  /** Whether to build galleries in subdirectories recursively */
  recursive: boolean;
  /** Optional base URL where the photos are hosted */
  baseUrl?: string;
  /** Scan for new photos */
  scan: boolean;
}

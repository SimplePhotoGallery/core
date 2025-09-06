/** Options for the gallery build command. */
export interface BuildOptions {
  /** Path to the gallery or root directory containing galleries. */
  gallery: string;
  /** Whether to scan directories recursively. */
  recursive: boolean;
  /** Base URL where the photos are hosted. */
  baseUrl?: string;
}

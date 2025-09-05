/**
 * Options for the build command.
 * Configures how the gallery build process should be executed.
 */
export interface BuildOptions {
  /** Path to the directory containing the gallery */
  gallery: string;
  /** Whether to scan subdirectories recursively for galleries */
  recursive: boolean;
  /** Optional base URL where the photos are hosted */
  baseUrl?: string;
}

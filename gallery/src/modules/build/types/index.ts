/**
 * Options for the `build` command.
 */
export interface BuildOptions {
  /** Path to the gallery directory. */
  gallery: string;
  /** Whether to scan subdirectories recursively. */
  recursive: boolean;
  /** Optional base URL where photos are hosted. */
  baseUrl?: string;
}

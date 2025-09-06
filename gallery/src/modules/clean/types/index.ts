/**
 * Options for the `clean` command.
 */
export interface CleanOptions {
  /** Path to the gallery directory. */
  gallery: string;
  /** Whether to scan subdirectories recursively. */
  recursive: boolean;
}

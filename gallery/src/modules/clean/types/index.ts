/** Options for cleaning gallery files */
export interface CleanOptions {
  /** Path to the directory containing the gallery */
  gallery: string;
  /** Whether to clean galleries in subdirectories recursively */
  recursive: boolean;
  /** Whether to also remove gallery.json files instead of only generated files */
  all: boolean;
  /** Whether to skip the confirmation prompt when removing gallery.json files */
  force: boolean;
}

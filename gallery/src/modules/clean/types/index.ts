/** Options for cleaning gallery files */
export interface CleanOptions {
  /** Path to the directory containing the gallery */
  gallery: string;
  /** Whether to clean galleries in subdirectories recursively */
  recursive: boolean;
}

/** Options for creating a new theme */
export interface CreateThemeOptions {
  /** Name of the theme to create */
  name: string;
  /** Path where the theme should be created. Default: ./themes/<name> */
  path?: string;
}

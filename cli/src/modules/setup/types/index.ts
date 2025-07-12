export interface PublicDirConfig {
  publicDir: string;
  images: string;
  thumbnails: string;
}

export interface SetupOptions {
  cliGallery?: string;
  output: string;
  copyFallback?: boolean;
  publicDir?: string;
}

export interface ScanOptions {
  photos: string;
  gallery?: string;
  recursive: boolean;
}

export interface SubGallery {
  title: string;
  headerImage: string;
  path: string;
}

export interface ProcessDirectoryResult {
  totalFiles: number;
  subGallery?: SubGallery;
}

import type { MediaFile } from '../../../types';

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

export interface ScanDirectoryResult {
  mediaFiles: MediaFile[];
  subGalleryDirectories: string[];
}

export interface ProcessDirectoryResult {
  totalFiles: number;
  totalGalleries: number;
  subGallery?: SubGallery;
}

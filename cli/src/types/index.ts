export interface MediaFile {
  type: 'image' | 'video';
  path: string;
  alt?: string;
  width: number;
  height: number;
  thumbnail?: {
    path: string;
    width: number;
    height: number;
  };
}

export interface GallerySection {
  title?: string;
  description?: string;
  images: MediaFile[];
}

export interface GalleryData {
  title: string;
  description: string;
  headerImage: string;
  metadata: { ogUrl: string };
  galleryOutputPath?: string;
  sections: GallerySection[];
}

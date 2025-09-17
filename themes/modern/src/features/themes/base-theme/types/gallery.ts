export interface GalleryImage {
  path: string;
  alt?: string;
  width: number;
  height: number;
  type: 'image' | 'video';
  thumbnail: {
    path: string;
    pathRetina: string;
    width: number;
    height: number;
  };
}

export interface GallerySection {
  title?: string;
  description?: string;
  images: GalleryImage[];
}

export interface SubGallery {
  title: string;
  headerImage: string;
  path: string;
}

export interface GalleryMetadata {
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;
  twitterSite?: string;
  twitterCreator?: string;
  author?: string;
  keywords?: string;
  canonicalUrl?: string;
  language?: string;
  robots?: string;
}

export interface GalleryData {
  title: string;
  description: string;
  url?: string;
  headerImage: string;
  metadata?: GalleryMetadata;
  mediaBaseUrl?: string;
  sections: GallerySection[];
  subGalleries?: {
    title?: string;
    description?: string;
    galleries: SubGallery[];
  };
}

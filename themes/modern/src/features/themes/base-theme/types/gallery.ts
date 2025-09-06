export interface GalleryImage {
  path: string;
  alt?: string;
  description?: string;
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
  description?: string;
  ogUrl?: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType?: string;
  ogSiteName?: string;
  twitterCard?: string;
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
  description?: string;
  outputDir?: string;
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

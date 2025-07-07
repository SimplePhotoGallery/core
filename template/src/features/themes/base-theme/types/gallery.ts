export interface GalleryImage {
  url: string;
  alt: string;
  description: string;
  width: number;
  height: number;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
}

export interface GallerySection {
  title: string;
  description: string;
  images: GalleryImage[];
}

export interface GalleryMetadata {
  description?: string;
  ogUrl: string;
  ogImage: string;
  ogImageWidth: number;
  ogImageHeight: number;
  ogType: string;
  ogSiteName: string;
  twitterCard: string;
  twitterSite: string;
  twitterCreator: string;
  author: string;
  keywords: string;
  canonicalUrl: string;
  language?: string;
  robots?: string;
}

export interface GalleryData {
  title: string;
  description: string;
  headerImage: string;
  metadata: GalleryMetadata;
  sections: GallerySection[];
}

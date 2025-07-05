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

export interface GalleryData {
  title: string;
  description: string;
  headerImage: string;
  sections: GallerySection[];
}

import type { GalleryMetadata, HeaderImageVariants } from '../gallery';
import type { ThumbnailConfig } from './config';

/** Resolved hero data with all paths computed and markdown parsed */
export interface ResolvedHero {
  title: string;
  description?: string;
  parsedDescription: string;
  headerImage?: string;
  headerPhotoPath: string;
  headerImageBlurHash?: string;
  headerImageVariants?: HeaderImageVariants;
  thumbnailBasePath: string;
  imgBasename: string;
  srcsets: {
    portraitAvif: string;
    portraitJpg: string;
    landscapeAvif: string;
    landscapeJpg: string;
  };
}

/** Resolved image with all paths computed */
export interface ResolvedImage {
  type: 'image' | 'video';
  filename: string;
  alt?: string;
  width: number;
  height: number;
  imagePath: string;
  thumbnailPath: string;
  thumbnailSrcSet?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  blurHash?: string;
}

/** Resolved section with parsed markdown and resolved image paths */
export interface ResolvedSection {
  title?: string;
  description?: string;
  parsedDescription: string;
  images: ResolvedImage[];
}

/** Resolved sub-gallery with computed thumbnail path */
export interface ResolvedSubGallery {
  title: string;
  headerImage: string;
  path: string;
  thumbnailPath: string;
  /** Pre-computed relative path for linking (only present when galleryJsonPath is provided to resolveGalleryData) */
  resolvedPath?: string;
}

/** Fully resolved gallery data ready for rendering */
export interface ResolvedGalleryData {
  title: string;
  url?: string;
  metadata: GalleryMetadata;
  analyticsScript?: string;
  ctaBanner?: boolean;
  hero: ResolvedHero;
  sections: ResolvedSection[];
  subGalleries?: {
    title: string;
    galleries: ResolvedSubGallery[];
  };
  // Pass through base URLs for components that need them
  mediaBaseUrl?: string;
  thumbsBaseUrl?: string;
  /**
   * Thumbnail configuration with dimension and edge settings.
   * Themes should use this for display sizing (e.g., row-height for modern theme).
   */
  thumbnails?: Required<ThumbnailConfig>;
}

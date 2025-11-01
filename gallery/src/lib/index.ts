// Re-export types from common package for use in other JS apps
export type {
  GalleryData,
  GalleryMetadata,
  GallerySection,
  MediaFile,
  MediaFileWithPath,
  SubGallery,
  Thumbnail,
} from '@simple-photo-gallery/common';

// Re-export utility functions from the CLI
export { generateBlurHash } from '../utils/blurhash';
export { loadImage, loadImageWithMetadata, resizeImage, cropAndResizeImage, createImageThumbnails } from '../utils/image';
export { getVideoDimensions, createVideoThumbnails } from '../utils/video';
export type { Dimensions, ImageWithMetadata } from '../types';

export { createGallerySocialMediaCardImage } from '../modules/build/utils';

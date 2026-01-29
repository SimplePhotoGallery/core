export type { GalleryLightboxOptions } from './lightbox';
export { createGalleryLightbox } from './lightbox';
export type { VideoPluginOptions } from './types';
export { PhotoSwipeVideoPlugin } from './video-plugin';

// Deep linking utilities
export type { DeepLinkingOptions } from './deep-linking';
export { updateGalleryURL, getImageIdFromURL, openImageById, setupDeepLinking, restoreFromURL } from './deep-linking';

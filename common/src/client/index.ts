// Blurhash utilities
export { decodeAllBlurhashes, decodeBlurhashToCanvas } from './blurhash';

// Hero image fallback
export type { HeroImageFallbackOptions } from './hero-fallback';
export { initHeroImageFallback } from './hero-fallback';

// PhotoSwipe integration
export type { GalleryLightboxOptions, VideoPluginOptions, DeepLinkingOptions } from './photoswipe';
export {
  createGalleryLightbox,
  PhotoSwipeVideoPlugin,
  setupDeepLinking,
  restoreFromURL,
  updateGalleryURL,
  getImageIdFromURL,
  openImageById,
} from './photoswipe';

// CSS utilities
export { deriveOpacityColor, normalizeHex, parseColor, setCSSVar } from './css-utils';

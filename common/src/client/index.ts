// Blurhash utilities
export { decodeAllBlurhashes, decodeBlurhashToCanvas } from './blurhash';

// Hero image fallback
export type { HeroImageFallbackOptions } from './hero-fallback';
export { initHeroImageFallback } from './hero-fallback';

// PhotoSwipe integration
export type { GalleryLightboxOptions, VideoPluginOptions } from './photoswipe';
export { createGalleryLightbox, injectPhotoSwipeStyles, PHOTOSWIPE_CSS_VARS, PhotoSwipeVideoPlugin } from './photoswipe';

// CSS utilities
export { deriveOpacityColor, normalizeHex, parseColor, setCSSVar } from './css-utils';

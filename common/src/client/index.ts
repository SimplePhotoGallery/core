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

// Product chrome localization; content language and media order remain unchanged.
export {
  galleryUiLocaleNames,
  galleryUiText,
  resolveGalleryUiLocale,
  matchGalleryUiLocale,
  availableGalleryUiLocales,
} from '../i18n';
export type { GalleryUiLocale, GalleryUiMessage } from '../i18n';
export {
  galleryUiLocaleLabel,
  getGalleryUiLocale,
  initializeGalleryUi,
  setGalleryUiLocale,
  localizeGalleryChrome,
  GALLERY_UI_LOCALE_EVENT,
} from './i18n';

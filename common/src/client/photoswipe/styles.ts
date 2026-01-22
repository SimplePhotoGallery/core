/**
 * Available CSS custom properties for PhotoSwipe customization.
 * Themes can override these variables in their own stylesheets.
 *
 * @example
 * ```css
 * :root {
 *   --pswp-caption-bg: rgba(0, 20, 40, 0.9);
 *   --pswp-caption-radius: 8px;
 *   --pswp-button-color: #3b82f6;
 * }
 * ```
 */
export const PHOTOSWIPE_CSS_VARS = {
  // Background
  bgColor: '--pswp-bg-color',

  // Buttons
  buttonColor: '--pswp-button-color',
  buttonOpacity: '--pswp-button-opacity',
  buttonOpacityHover: '--pswp-button-opacity-hover',

  // Counter
  counterColor: '--pswp-counter-color',
  counterFontSize: '--pswp-counter-font-size',

  // Caption container
  captionBg: '--pswp-caption-bg',
  captionBlur: '--pswp-caption-blur',
  captionColor: '--pswp-caption-color',
  captionPadding: '--pswp-caption-padding',
  captionPaddingMobile: '--pswp-caption-padding-mobile',
  captionRadius: '--pswp-caption-radius',
  captionMargin: '--pswp-caption-margin',
  captionMarginMobile: '--pswp-caption-margin-mobile',
  captionShadow: '--pswp-caption-shadow',
  captionMaxWidth: '--pswp-caption-max-width',

  // Caption typography
  captionTitleSize: '--pswp-caption-title-size',
  captionTitleWeight: '--pswp-caption-title-weight',
  captionTextSize: '--pswp-caption-text-size',
  captionTextSizeMobile: '--pswp-caption-text-size-mobile',
  captionDescriptionSize: '--pswp-caption-description-size',

  // Animation
  slideAnimationDuration: '--pswp-slide-animation-duration',
  slideAnimationEasing: '--pswp-slide-animation-easing',
} as const;

const PHOTOSWIPE_STYLES = `
/* PhotoSwipe CSS Custom Properties - Override these in your theme */
:root {
  /* Background */
  --pswp-bg-color: rgba(0, 0, 0, 1);

  /* Buttons */
  --pswp-button-color: white;
  --pswp-button-opacity: 0.8;
  --pswp-button-opacity-hover: 1;

  /* Counter */
  --pswp-counter-color: white;
  --pswp-counter-font-size: 1rem;

  /* Caption container */
  --pswp-caption-bg: rgba(128, 128, 128, 0.3);
  --pswp-caption-blur: 8px;
  --pswp-caption-color: white;
  --pswp-caption-padding: 16px;
  --pswp-caption-padding-mobile: 8px 16px;
  --pswp-caption-radius: 16px;
  --pswp-caption-margin: 1rem;
  --pswp-caption-margin-mobile: 8px 0;
  --pswp-caption-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --pswp-caption-max-width: 42rem;

  /* Caption typography */
  --pswp-caption-title-size: 1.5rem;
  --pswp-caption-title-weight: 600;
  --pswp-caption-text-size: 1rem;
  --pswp-caption-text-size-mobile: 0.8rem;
  --pswp-caption-description-size: 0.95rem;

  /* Animation */
  --pswp-slide-animation-duration: 0.6s;
  --pswp-slide-animation-easing: ease-out;
}

/* PhotoSwipe enhanced styles */
.pswp .pswp__bg {
  --pswp-bg: var(--pswp-bg-color);
}

.pswp__counter {
  color: var(--pswp-counter-color);
  font-size: var(--pswp-counter-font-size);
}

.pswp__button {
  color: var(--pswp-button-color);
  opacity: var(--pswp-button-opacity);
  transition: opacity 0.3s ease;
}

.pswp__button:hover {
  opacity: var(--pswp-button-opacity-hover);
}

.pswp__caption {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

@media (max-width: 768px) {
  .pswp__caption {
    width: calc(100% - 16px);
  }
}

.pswp__caption .image-caption {
  text-align: left;
  background: var(--pswp-caption-bg);
  backdrop-filter: blur(var(--pswp-caption-blur));
  -webkit-backdrop-filter: blur(var(--pswp-caption-blur));
  color: var(--pswp-caption-color);
  padding: var(--pswp-caption-padding);
  border-radius: var(--pswp-caption-radius);
  margin: var(--pswp-caption-margin);
  box-shadow: var(--pswp-caption-shadow);
}

@media (max-width: 768px) {
  .pswp__caption .image-caption {
    padding: var(--pswp-caption-padding-mobile);
    font-size: var(--pswp-caption-text-size-mobile);
    margin: var(--pswp-caption-margin-mobile);
  }
}

.pswp__caption__center {
  text-align: center;
  max-width: var(--pswp-caption-max-width);
  margin: 0 auto;
}

.pswp__caption h3 {
  font-size: var(--pswp-caption-title-size);
  font-weight: var(--pswp-caption-title-weight);
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.pswp__caption p {
  font-size: var(--pswp-caption-text-size);
  opacity: 0.95;
  line-height: 1.6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  font-weight: 400;
}

.pswp__caption .description {
  display: block;
  margin-top: 0.5rem;
  font-size: var(--pswp-caption-description-size);
  opacity: 0.9;
  font-weight: 300;
  font-style: italic;
}

/* Slide-in animation */
.pswp__img {
  opacity: 0;
}

.pswp__img--in-viewport {
  animation: pswp-slideIn var(--pswp-slide-animation-duration) var(--pswp-slide-animation-easing) forwards;
}

@keyframes pswp-slideIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

/**
 * Inject PhotoSwipe enhanced styles into the document.
 * Includes custom styles for captions, animations, and button hover effects.
 * Safe to call multiple times - will only inject once.
 * Called automatically by createGalleryLightbox(), so you typically don't need to call this directly.
 *
 * All styles use CSS custom properties that can be overridden by themes.
 * See {@link PHOTOSWIPE_CSS_VARS} for available variables.
 *
 * Note: Base PhotoSwipe CSS (photoswipe/style.css) must still be imported in your theme.
 * This function only injects the enhanced SPG-specific styles.
 *
 * @example
 * ```typescript
 * import { createGalleryLightbox } from '@simple-photo-gallery/common/client';
 * import 'photoswipe/style.css'; // Required base styles
 *
 * const lightbox = await createGalleryLightbox();
 * lightbox.init();
 * ```
 *
 * @example Customize in your theme's CSS:
 * ```css
 * :root {
 *   --pswp-caption-bg: rgba(0, 20, 40, 0.9);
 *   --pswp-caption-radius: 8px;
 *   --pswp-button-color: #3b82f6;
 * }
 * ```
 */
export function injectPhotoSwipeStyles(): void {
  if (document.querySelector('#spg-photoswipe-styles')) return;

  const style = document.createElement('style');
  style.id = 'spg-photoswipe-styles';
  style.textContent = PHOTOSWIPE_STYLES;
  document.head.append(style);
}

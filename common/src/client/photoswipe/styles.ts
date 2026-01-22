const PHOTOSWIPE_STYLES = `
/* PhotoSwipe enhanced styles */
.pswp .pswp__bg {
  --pswp-bg: rgba(0, 0, 0, 1);
}

.pswp__counter {
  color: white;
  font-size: 1rem;
}

.pswp__button {
  color: white;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.pswp__button:hover {
  opacity: 1;
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
  background: rgba(128, 128, 128, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  padding: 16px;
  border-radius: 16px;
  margin: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .pswp__caption .image-caption {
    padding: 8px 16px;
    font-size: 0.8rem;
    margin: 8px 0;
  }
}

.pswp__caption__center {
  text-align: center;
  max-width: 42rem;
  margin: 0 auto;
}

.pswp__caption h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.pswp__caption p {
  font-size: 1rem;
  opacity: 0.95;
  line-height: 1.6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  font-weight: 400;
}

.pswp__caption .description {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.95rem;
  opacity: 0.9;
  font-weight: 300;
  font-style: italic;
}

/* Slide-in animation */
.pswp__img {
  opacity: 0;
}

.pswp__img--in-viewport {
  animation: pswp-slideIn 0.6s ease-out forwards;
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
 */
export function injectPhotoSwipeStyles(): void {
  if (document.querySelector('#spg-photoswipe-styles')) return;

  const style = document.createElement('style');
  style.id = 'spg-photoswipe-styles';
  style.textContent = PHOTOSWIPE_STYLES;
  document.head.append(style);
}

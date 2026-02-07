/** Options for the hero image fallback behavior */
export interface HeroImageFallbackOptions {
  /** CSS selector for the picture element (default: '#hero-bg-picture') */
  pictureSelector?: string;
  /** CSS selector for the img element within picture (default: 'img.hero__bg-img') */
  imgSelector?: string;
  /** CSS selector for the blurhash canvas element (default: 'canvas[data-blur-hash]') */
  canvasSelector?: string;
}

/**
 * Initialize hero image fallback behavior.
 * Handles:
 * - Hiding blurhash canvas when image loads successfully
 * - Removing source elements and retrying with fallback src on error
 * - Keeping blurhash visible if final fallback also fails
 *
 * @param options - Configuration options for selectors
 *
 * @example
 * ```typescript
 * import { initHeroImageFallback } from '@simple-photo-gallery/common/client';
 *
 * // Use default selectors
 * initHeroImageFallback();
 *
 * // Or with custom selectors
 * initHeroImageFallback({
 *   pictureSelector: '#my-hero-picture',
 *   imgSelector: 'img.my-hero-img',
 *   canvasSelector: 'canvas.my-blurhash',
 * });
 * ```
 */
export function initHeroImageFallback(options: HeroImageFallbackOptions = {}): void {
  const {
    pictureSelector = '#hero-bg-picture',
    imgSelector = 'img.hero__bg-img',
    canvasSelector = 'canvas[data-blur-hash]',
  } = options;

  const picture = document.querySelector<HTMLPictureElement>(pictureSelector);
  const img = picture?.querySelector<HTMLImageElement>(imgSelector);
  const canvas = document.querySelector<HTMLCanvasElement>(canvasSelector);

  if (!img) return;

  const fallbackSrc = img.getAttribute('src') || '';
  let didFallback = false;

  const hideBlurhash = () => {
    if (canvas) {
      canvas.style.display = 'none';
    }
  };

  const doFallback = () => {
    if (didFallback) return;
    didFallback = true;

    if (picture) {
      // Remove all <source> elements so the browser does not retry them
      for (const sourceEl of picture.querySelectorAll('source')) {
        sourceEl.remove();
      }
    }

    // Force reload using the <img> src as the final fallback
    const current = img.getAttribute('src') || '';
    img.setAttribute('src', '');
    img.setAttribute('src', fallbackSrc || current);

    // If fallback also fails, keep blurhash visible
    img.addEventListener(
      'error',
      () => {
        // Final fallback failed, blurhash stays visible
      },
      { once: true },
    );

    // If fallback succeeds, hide blurhash
    img.addEventListener('load', hideBlurhash, { once: true });
  };

  // Check if image already loaded or failed before script runs
  if (img.complete) {
    if (img.naturalWidth === 0) {
      doFallback();
    } else {
      hideBlurhash();
    }
  } else {
    img.addEventListener('load', hideBlurhash, { once: true });
  }

  img.addEventListener('error', doFallback, { once: true });
}

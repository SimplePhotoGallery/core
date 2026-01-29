import type PhotoSwipeLightbox from 'photoswipe/lightbox';

/** Options for URL deep-linking functionality */
export interface DeepLinkingOptions {
  /** CSS selector for galleries (default: '.gallery-grid') */
  gallerySelector?: string;
  /** CSS selector for gallery items (default: 'a') */
  itemSelector?: string;
  /** URL parameter name for image ID (default: 'image') */
  parameterName?: string;
  /** Delay in ms before opening image on page load (default: 100) */
  openDelay?: number;
}

/**
 * Updates browser URL with current image ID.
 * Uses History API to replace state without page reload.
 */
export function updateGalleryURL(imageId: string | null, paramName: string = 'image'): void {
  const url = new URL(globalThis.location.href);
  if (imageId) {
    url.searchParams.set(paramName, imageId);
  } else {
    url.searchParams.delete(paramName);
  }
  globalThis.history.replaceState({}, '', url.toString());
}

/**
 * Extracts image ID from URL parameters.
 */
export function getImageIdFromURL(paramName: string = 'image'): string | null {
  const params = new URLSearchParams(globalThis.location.search);
  return params.get(paramName);
}

/**
 * Opens a specific image by ID within a gallery.
 * Searches through all gallery items and opens matching image in lightbox.
 *
 * @returns true if image was found and opened, false otherwise
 */
export function openImageById(lightbox: PhotoSwipeLightbox, imageId: string, options: DeepLinkingOptions = {}): boolean {
  const gallerySelector = options.gallerySelector ?? '.gallery-grid';
  const itemSelector = options.itemSelector ?? 'a';

  const galleries = document.querySelectorAll(gallerySelector);
  const allItems: HTMLElement[] = [];

  for (const gallery of galleries) {
    const items = gallery.querySelectorAll<HTMLElement>(itemSelector);
    allItems.push(...items);
  }

  for (const [i, item] of allItems.entries()) {
    const itemId = item.dataset.imageId || '';
    if (itemId === imageId) {
      lightbox.loadAndOpen(i);
      return true;
    }
  }
  return false;
}

/**
 * Sets up automatic URL updates when lightbox changes.
 * Call after creating lightbox but before init().
 *
 * @example
 * ```typescript
 * const lightbox = await createGalleryLightbox();
 * setupDeepLinking(lightbox);
 * lightbox.init();
 * restoreFromURL(lightbox);
 * ```
 */
export function setupDeepLinking(lightbox: PhotoSwipeLightbox, options: DeepLinkingOptions = {}): void {
  const paramName = options.parameterName ?? 'image';

  // Update URL when slide changes
  lightbox.on('change', () => {
    if (lightbox.pswp) {
      const currSlideElement = lightbox.pswp.currSlide?.data.element as HTMLElement | undefined;
      const imageId = currSlideElement?.dataset?.imageId ?? null;
      updateGalleryURL(imageId, paramName);
    }
  });

  // Clear URL parameter when lightbox closes
  lightbox.on('close', () => {
    updateGalleryURL(null, paramName);
  });
}

/**
 * Restores gallery state from URL on page load.
 * Automatically opens image if specified in URL parameters.
 * Call after lightbox.init().
 *
 * @example
 * ```typescript
 * const lightbox = await createGalleryLightbox();
 * setupDeepLinking(lightbox);
 * lightbox.init();
 * restoreFromURL(lightbox);
 * ```
 */
export function restoreFromURL(lightbox: PhotoSwipeLightbox, options: DeepLinkingOptions = {}): void {
  const paramName = options.parameterName ?? 'image';
  const openDelay = options.openDelay ?? 100;
  const imageIdFromURL = getImageIdFromURL(paramName);

  if (imageIdFromURL) {
    const open = () => {
      setTimeout(() => openImageById(lightbox, imageIdFromURL, options), openDelay);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', open);
    } else {
      open();
    }
  }
}

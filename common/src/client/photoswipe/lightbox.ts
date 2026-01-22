import { injectPhotoSwipeStyles } from './styles';
import { PhotoSwipeVideoPlugin } from './video-plugin';

import type { VideoPluginOptions } from './types';
import type PhotoSwipe from 'photoswipe';
import type PhotoSwipeLightbox from 'photoswipe/lightbox';

/** Options for creating a gallery lightbox */
export interface GalleryLightboxOptions {
  /** CSS selector for gallery container (default: '.gallery-grid') */
  gallerySelector?: string;
  /** CSS selector for gallery items within container (default: 'a') */
  childrenSelector?: string;
  /** Animation duration when opening in ms (default: 300) */
  showAnimationDuration?: number;
  /** Animation duration when closing in ms (default: 300) */
  hideAnimationDuration?: number;
  /** Enable mouse wheel zoom (default: true) */
  wheelToZoom?: boolean;
  /** Loop back to first image after last (default: false) */
  loop?: boolean;
  /** Background opacity 0-1 (default: 1) */
  bgOpacity?: number;
  /** Options for the video plugin */
  videoPluginOptions?: VideoPluginOptions;
  /** Enable slide-in animations when changing slides (default: true) */
  slideAnimations?: boolean;
  /** Enable custom caption UI from data-pswp-caption attribute (default: true) */
  enableCaptions?: boolean;
}

/**
 * Create a PhotoSwipe lightbox with sensible defaults and video support.
 * Returns the lightbox instance for further customization before calling init().
 *
 * @example
 * ```typescript
 * import { createGalleryLightbox } from '@simple-photo-gallery/common/client';
 * import 'photoswipe/style.css';
 *
 * // Basic usage
 * const lightbox = await createGalleryLightbox();
 * lightbox.init();
 *
 * // With custom options
 * const lightbox = await createGalleryLightbox({
 *   gallerySelector: '.my-gallery',
 *   loop: true,
 * });
 *
 * // Add custom event handlers before init
 * lightbox.on('change', () => console.log('slide changed'));
 * lightbox.init();
 * ```
 */
export async function createGalleryLightbox(options: GalleryLightboxOptions = {}): Promise<PhotoSwipeLightbox> {
  // Inject enhanced styles - safe to call multiple times
  injectPhotoSwipeStyles();

  const photoswipeModule = await import('photoswipe');
  const PhotoSwipe = photoswipeModule.default;
  const lightboxModule = await import('photoswipe/lightbox');
  const PhotoSwipeLightboxModule = lightboxModule.default;

  const lightbox = new PhotoSwipeLightboxModule({
    gallery: options.gallerySelector ?? '.gallery-grid',
    children: options.childrenSelector ?? 'a',
    pswpModule: PhotoSwipe,
    showAnimationDuration: options.showAnimationDuration ?? 300,
    hideAnimationDuration: options.hideAnimationDuration ?? 300,
    wheelToZoom: options.wheelToZoom ?? true,
    loop: options.loop ?? false,
    bgOpacity: options.bgOpacity ?? 1,
  });

  new PhotoSwipeVideoPlugin(lightbox, options.videoPluginOptions);

  // Slide animations (enabled by default)
  if (options.slideAnimations !== false) {
    lightbox.on('contentDeactivate', ({ content }: { content: { element?: HTMLElement } }) => {
      content.element?.classList.remove('pswp__img--in-viewport');
    });
    lightbox.on('contentActivate', ({ content }: { content: { element?: HTMLElement } }) => {
      content.element?.classList.add('pswp__img--in-viewport');
    });
  }

  // Custom caption UI (enabled by default)
  if (options.enableCaptions !== false) {
    lightbox.on('uiRegister', () => {
      (lightbox.pswp as PhotoSwipe | undefined)?.ui?.registerElement({
        name: 'custom-caption',
        isButton: false,
        className: 'pswp__caption',
        appendTo: 'wrapper',
        onInit: (el: HTMLElement) => {
          (lightbox.pswp as PhotoSwipe | undefined)?.on('change', () => {
            const currSlideElement = (lightbox.pswp as PhotoSwipe | undefined)?.currSlide?.data.element as
              | HTMLElement
              | undefined;
            if (currSlideElement) {
              const caption = (currSlideElement as HTMLElement).dataset.pswpCaption;
              el.innerHTML = caption || currSlideElement.querySelector('img')?.alt || '';
            }
          });
        },
      });
    });
  }

  return lightbox;
}

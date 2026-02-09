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

const CAPTION_SAMPLE_SIZE = 50;
const CAPTION_SAMPLE_HEIGHT_RATIO = 0.15;

/* Caption backgrounds chosen based on image brightness */
const CAPTION_BG_DARK = 'rgba(255, 255, 255, 0.5)'; // white frost on dark images
const CAPTION_BG_LIGHT = 'rgba(0, 0, 0, 0.8)'; // dark frost on light images
const BRIGHTNESS_THRESHOLD = 80;

function captionBgForBrightness(brightness: number): string {
  return brightness >= BRIGHTNESS_THRESHOLD ? CAPTION_BG_LIGHT : CAPTION_BG_DARK;
}

/**
 * Creates a reusable function that samples the average brightness
 * of the bottom strip of an image using an offscreen canvas.
 */
function createCaptionBrightnessSampler() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  canvas.width = CAPTION_SAMPLE_SIZE;
  canvas.height = CAPTION_SAMPLE_SIZE;

  return (img: HTMLImageElement): number | null => {
    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return null;

    const srcWidth = img.naturalWidth;
    const srcHeight = img.naturalHeight;
    const sampleHeight = Math.max(1, Math.round(srcHeight * CAPTION_SAMPLE_HEIGHT_RATIO));
    const srcY = Math.max(0, srcHeight - sampleHeight);

    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, srcY, srcWidth, sampleHeight, 0, 0, canvas.width, canvas.height);

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let sum = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        count++;
      }

      return count ? sum / count : null;
    } catch {
      return null;
    }
  };
}

/**
 * Create a PhotoSwipe lightbox with sensible defaults and video support.
 * Returns the lightbox instance for further customization before calling init().
 *
 * IMPORTANT: You must import the PhotoSwipe CSS files for the lightbox to work properly:
 * - `import 'photoswipe/style.css'` - Base PhotoSwipe styles
 * - `import '@simple-photo-gallery/common/styles/photoswipe'` - SPG enhancement styles
 *
 * @example
 * ```typescript
 * import { createGalleryLightbox } from '@simple-photo-gallery/common/client';
 * import 'photoswipe/style.css';
 * import '@simple-photo-gallery/common/styles/photoswipe';
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
  const photoswipeModule = await import('photoswipe');
  const PhotoSwipe = photoswipeModule.default;
  const lightboxModule = await import('photoswipe/lightbox');
  const PhotoSwipeLightboxModule = lightboxModule.default;
  const sampleBrightness = createCaptionBrightnessSampler();

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

              // Adapt caption background based on image brightness
              if (sampleBrightness) {
                const img = currSlideElement.querySelector('img');
                const apply = () => {
                  if (!img) return;
                  const brightness = sampleBrightness(img);
                  if (brightness === null) {
                    el.style.removeProperty('--pswp-caption-bg');
                  } else {
                    el.style.setProperty('--pswp-caption-bg', captionBgForBrightness(brightness));
                  }
                };

                if (img && (!img.complete || img.naturalWidth === 0)) {
                  img.addEventListener('load', apply, { once: true });
                } else {
                  apply();
                }
              }
            }
          });
        },
      });
    });
  }

  return lightbox;
}

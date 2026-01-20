/**
 * Client-side utilities for Simple Photo Gallery themes.
 * This module contains browser-only code and should only be imported in client contexts.
 */

import { decode } from 'blurhash';

import type PhotoSwipe from 'photoswipe';
import type PhotoSwipeLightbox from 'photoswipe/lightbox';

// ============================================================================
// Blurhash Utilities
// ============================================================================

/**
 * Decode a single blurhash and draw it to a canvas element.
 *
 * @param canvas - The canvas element with a data-blur-hash attribute
 * @param width - The width to decode at (default: 32)
 * @param height - The height to decode at (default: 32)
 */
export function decodeBlurhashToCanvas(canvas: HTMLCanvasElement, width: number = 32, height: number = 32): void {
  const blurHashValue = canvas.dataset.blurHash;
  if (!blurHashValue) return;

  const pixels = decode(blurHashValue, width, height);
  const ctx = canvas.getContext('2d');
  if (pixels && ctx) {
    const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height);
    ctx.putImageData(imageData, 0, 0);
  }
}

/**
 * Decode and render all blurhash canvases on the page.
 * Finds all canvas elements with data-blur-hash attribute and draws the decoded image.
 *
 * @param selector - CSS selector for canvas elements (default: 'canvas[data-blur-hash]')
 * @param width - The width to decode at (default: 32)
 * @param height - The height to decode at (default: 32)
 */
export function decodeAllBlurhashes(
  selector: string = 'canvas[data-blur-hash]',
  width: number = 32,
  height: number = 32,
): void {
  const canvases = document.querySelectorAll<HTMLCanvasElement>(selector);
  for (const canvas of canvases) {
    decodeBlurhashToCanvas(canvas, width, height);
  }
}

// ============================================================================
// Hero Image Fallback
// ============================================================================

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

// ============================================================================
// PhotoSwipe Video Plugin Types
// ============================================================================

interface Slide {
  content: Content;
  height: number;
  currZoomLevel: number;
  bounds: { center: { y: number } };
  placeholder?: { element: HTMLElement };
  isActive: boolean;
}

interface Content {
  data: SlideData;
  element?: HTMLVideoElement | HTMLImageElement | HTMLDivElement;
  state?: string;
  type?: string;
  isAttached?: boolean;
  onLoaded?: () => void;
  appendImage?: () => void;
  slide?: Slide;
  _videoPosterImg?: HTMLImageElement;
}

interface SlideData {
  type?: string;
  msrc?: string;
  videoSrc?: string;
  videoSources?: Array<{ src: string; type: string }>;
}

/** Options for the PhotoSwipe video plugin */
export interface VideoPluginOptions {
  /** HTML attributes to apply to video elements */
  videoAttributes?: Record<string, string>;
  /** Whether to autoplay videos when they become active */
  autoplay?: boolean;
  /** Pixels from bottom of video where drag is prevented (for video controls) */
  preventDragOffset?: number;
}

interface EventData {
  content?: Content;
  slide?: Slide;
  width?: number;
  height?: number;
  originalEvent?: PointerEvent;
  preventDefault?: () => void;
}

// ============================================================================
// PhotoSwipe Video Plugin Implementation
// ============================================================================

const defaultOptions: VideoPluginOptions = {
  videoAttributes: { controls: '', playsinline: '', preload: 'auto' },
  autoplay: true,
  preventDragOffset: 40,
};

/**
 * Check if slide has video content
 */
function isVideoContent(content: Content | Slide): boolean {
  return content && 'data' in content && content.data && content.data.type === 'video';
}

class VideoContentSetup {
  private options: VideoPluginOptions;

  constructor(lightbox: PhotoSwipeLightbox, options: VideoPluginOptions) {
    this.options = options;

    this.initLightboxEvents(lightbox);
    lightbox.on('init', () => {
      if (lightbox.pswp) {
        this.initPswpEvents(lightbox.pswp);
      }
    });
  }

  private initLightboxEvents(lightbox: PhotoSwipeLightbox): void {
    lightbox.on('contentLoad', (data: unknown) => this.onContentLoad(data as EventData));
    lightbox.on('contentDestroy', (data: unknown) => this.onContentDestroy(data as { content: Content }));
    lightbox.on('contentActivate', (data: unknown) => this.onContentActivate(data as { content: Content }));
    lightbox.on('contentDeactivate', (data: unknown) => this.onContentDeactivate(data as { content: Content }));
    lightbox.on('contentAppend', (data: unknown) => this.onContentAppend(data as EventData));
    lightbox.on('contentResize', (data: unknown) => this.onContentResize(data as EventData));

    lightbox.addFilter('isKeepingPlaceholder', (value: unknown, ...args: unknown[]) =>
      this.isKeepingPlaceholder(value as boolean, args[0] as Content),
    );
    lightbox.addFilter('isContentZoomable', (value: unknown, ...args: unknown[]) =>
      this.isContentZoomable(value as boolean, args[0] as Content),
    );
    lightbox.addFilter('useContentPlaceholder', (value: unknown, ...args: unknown[]) =>
      this.useContentPlaceholder(value as boolean, args[0] as Content),
    );

    lightbox.addFilter('domItemData', (value: unknown, ...args: unknown[]) => {
      const itemData = value as Record<string, unknown>;
      const linkEl = args[1] as HTMLAnchorElement;

      if (itemData.type === 'video' && linkEl) {
        if (linkEl.dataset.pswpVideoSources) {
          itemData.videoSources = JSON.parse(linkEl.dataset.pswpVideoSources);
        } else if (linkEl.dataset.pswpVideoSrc) {
          itemData.videoSrc = linkEl.dataset.pswpVideoSrc;
        } else {
          itemData.videoSrc = linkEl.href;
        }
      }
      return itemData;
    });
  }

  private initPswpEvents(pswp: PhotoSwipe): void {
    // Prevent dragging when pointer is in bottom part of the video
    pswp.on('pointerDown', (data: unknown) => {
      const e = data as EventData;
      const slide = pswp.currSlide as Slide | undefined;
      if (slide && isVideoContent(slide) && this.options.preventDragOffset) {
        const origEvent = e.originalEvent;
        if (origEvent && origEvent.type === 'pointerdown') {
          const videoHeight = Math.ceil(slide.height * slide.currZoomLevel);
          const verticalEnding = videoHeight + slide.bounds.center.y;
          const pointerYPos = origEvent.pageY - pswp.offset.y;
          if (pointerYPos > verticalEnding - this.options.preventDragOffset! && pointerYPos < verticalEnding) {
            e.preventDefault?.();
          }
        }
      }
    });

    // do not append video on nearby slides
    pswp.on('appendHeavy', (data: unknown) => {
      const e = data as EventData;
      if (e.slide && isVideoContent(e.slide) && !e.slide.isActive) {
        e.preventDefault?.();
      }
    });

    pswp.on('close', () => {
      const slide = pswp.currSlide as Slide | undefined;
      if (slide && isVideoContent(slide.content)) {
        // Switch from zoom to fade closing transition,
        // as zoom transition is choppy for videos
        if (!pswp.options.showHideAnimationType || pswp.options.showHideAnimationType === 'zoom') {
          pswp.options.showHideAnimationType = 'fade';
        }

        // pause video when closing
        this.pauseVideo(slide.content);
      }
    });
  }

  private onContentDestroy({ content }: { content: Content }): void {
    if (isVideoContent(content) && content._videoPosterImg) {
      const handleLoad = () => {
        if (content._videoPosterImg) {
          content._videoPosterImg.removeEventListener('error', handleError);
        }
      };
      const handleError = () => {
        // Error handler
      };

      content._videoPosterImg.addEventListener('load', handleLoad);
      content._videoPosterImg.addEventListener('error', handleError);
      content._videoPosterImg = undefined;
    }
  }

  private onContentResize(e: EventData): void {
    if (e.content && isVideoContent(e.content)) {
      e.preventDefault?.();

      const width = e.width!;
      const height = e.height!;
      const content = e.content;

      if (content.element) {
        content.element.style.width = width + 'px';
        content.element.style.height = height + 'px';
      }

      if (content.slide && content.slide.placeholder) {
        // override placeholder size, so it more accurately matches the video
        const placeholderElStyle = content.slide.placeholder.element.style;
        placeholderElStyle.transform = 'none';
        placeholderElStyle.width = width + 'px';
        placeholderElStyle.height = height + 'px';
      }
    }
  }

  private isKeepingPlaceholder(isZoomable: boolean, content: Content): boolean {
    if (isVideoContent(content)) {
      return false;
    }
    return isZoomable;
  }

  private isContentZoomable(isZoomable: boolean, content: Content): boolean {
    if (isVideoContent(content)) {
      return false;
    }
    return isZoomable;
  }

  private onContentActivate({ content }: { content: Content }): void {
    if (isVideoContent(content) && this.options.autoplay) {
      this.playVideo(content);
    }
  }

  private onContentDeactivate({ content }: { content: Content }): void {
    if (isVideoContent(content)) {
      this.pauseVideo(content);
    }
  }

  private onContentAppend(e: EventData): void {
    if (e.content && isVideoContent(e.content)) {
      e.preventDefault?.();
      e.content.isAttached = true;
      e.content.appendImage?.();
    }
  }

  private onContentLoad(e: EventData): void {
    const content = e.content!;

    if (!isVideoContent(content)) {
      return;
    }

    // stop default content load
    e.preventDefault?.();

    if (content.element) {
      return;
    }

    content.state = 'loading';
    content.type = 'video';

    content.element = document.createElement('video');

    if (this.options.videoAttributes) {
      for (const key in this.options.videoAttributes) {
        content.element.setAttribute(key, this.options.videoAttributes[key] || '');
      }
    }

    content.element.setAttribute('poster', content.data.msrc || '');

    this.preloadVideoPoster(content, content.data.msrc);

    content.element.style.position = 'absolute';
    content.element.style.left = '0';
    content.element.style.top = '0';

    if (content.data.videoSources) {
      for (const source of content.data.videoSources) {
        const sourceEl = document.createElement('source');
        sourceEl.src = source.src;
        sourceEl.type = source.type;
        content.element.append(sourceEl);
      }
    } else if (content.data.videoSrc) {
      content.element.src = content.data.videoSrc;
    }
  }

  private preloadVideoPoster(content: Content, src?: string): void {
    if (!content._videoPosterImg && src) {
      content._videoPosterImg = new Image();
      content._videoPosterImg.src = src;
      if (content._videoPosterImg.complete) {
        content.onLoaded?.();
      } else {
        content._videoPosterImg.addEventListener('load', () => {
          content.onLoaded?.();
        });
        content._videoPosterImg.addEventListener('error', () => {
          content.onLoaded?.();
        });
      }
    }
  }

  private playVideo(content: Content): void {
    if (content.element) {
      (content.element as HTMLVideoElement).play();
    }
  }

  private pauseVideo(content: Content): void {
    if (content.element) {
      (content.element as HTMLVideoElement).pause();
    }
  }

  private useContentPlaceholder(usePlaceholder: boolean, content: Content): boolean {
    if (isVideoContent(content)) {
      return true;
    }
    return usePlaceholder;
  }
}

/**
 * PhotoSwipe plugin that adds video support to the lightbox.
 * Videos are automatically detected by the `data-pswp-type="video"` attribute
 * on gallery links.
 *
 * @example
 * ```typescript
 * import PhotoSwipe from 'photoswipe';
 * import PhotoSwipeLightbox from 'photoswipe/lightbox';
 * import { PhotoSwipeVideoPlugin } from '@simple-photo-gallery/common/client';
 *
 * const lightbox = new PhotoSwipeLightbox({
 *   gallery: '.gallery',
 *   children: 'a',
 *   pswpModule: PhotoSwipe,
 * });
 *
 * new PhotoSwipeVideoPlugin(lightbox);
 * lightbox.init();
 * ```
 */
export class PhotoSwipeVideoPlugin {
  constructor(lightbox: PhotoSwipeLightbox, options: VideoPluginOptions = {}) {
    new VideoContentSetup(lightbox, {
      ...defaultOptions,
      ...options,
    });
  }
}

// ============================================================================
// Gallery Lightbox Factory
// ============================================================================

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

// ============================================================================
// PhotoSwipe Enhanced Styles
// ============================================================================

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

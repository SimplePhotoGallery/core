export interface Slide {
  content: Content;
  height: number;
  currZoomLevel: number;
  bounds: { center: { y: number } };
  placeholder?: { element: HTMLElement };
  isActive: boolean;
}

export interface Content {
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

export interface SlideData {
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

export interface EventData {
  content?: Content;
  slide?: Slide;
  width?: number;
  height?: number;
  originalEvent?: PointerEvent;
  preventDefault?: () => void;
}

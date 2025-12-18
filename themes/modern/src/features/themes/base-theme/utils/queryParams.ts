const TYPOGRAPHY_MODERN_THEME_PRESETS: Record<string, { title: string; description: string }> = {
  light: { title: 'rgba(255, 255, 255, 0.95)', description: 'rgba(255, 255, 255, 0.75)' },
  white: { title: 'rgba(255, 255, 255, 0.95)', description: 'rgba(255, 255, 255, 0.75)' },
  dark: { title: '#111827', description: '#6b7280' },
  black: { title: '#111827', description: '#6b7280' },
};

/**
 * Normalizes hex color values to 6-digit format (e.g., #abc -> #aabbcc).
 * Returns null if the hex value is invalid.
 */
const normalizeHex = (hex: string): string | null => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  return hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex) ? `#${hex}` : null;
};

/**
 * Parses and validates a color value from query parameters.
 * Supports CSS color names, hex values, rgb/rgba, and 'transparent'.
 * Returns null if the color is invalid.
 */
const parseColor = (colorParam: string | null): string | null => {
  if (!colorParam) return null;
  const normalized = colorParam.toLowerCase().trim();
  if (normalized === 'transparent') return 'transparent';

  const testEl = document.createElement('div');
  testEl.style.color = normalized;
  if (testEl.style.color) return normalized;

  return normalizeHex(colorParam);
};

/**
 * Sets or removes a CSS custom property (variable) on an element.
 * Removes the property if value is null.
 */
const setCSSVar = (root: HTMLElement, name: string, value: string | null): void => {
  if (value) {
    root.style.setProperty(name, value);
  } else {
    root.style.removeProperty(name);
  }
};

/**
 * Derives a description color from a title color by adjusting opacity to 0.8.
 * Converts rgb to rgba if needed, otherwise returns the original color.
 */
const deriveDescriptionColor = (titleColor: string): string => {
  if (titleColor.startsWith('rgba')) {
    return titleColor.replace(/,\s*[\d.]+\)$/, ', 0.8)');
  }
  if (titleColor.startsWith('rgb')) {
    return titleColor.replace('rgb', 'rgba').replace(')', ', 0.8)');
  }
  return titleColor;
};

/**
 * Controls the visibility of the hero/header image based on the 'headerImage' query parameter.
 * Hides the hero section if headerImage is 'false' or '0'.
 */
const applyHeaderImageVisibility = (params: URLSearchParams): void => {
  const heroSection = document.querySelector<HTMLElement>('.hero');
  if (!heroSection) return;

  const headerImage = params.get('headerImage');
  heroSection.style.display = headerImage === 'false' || headerImage === '0' ? 'none' : '';
};

/**
 * Applies transparent background styling when 'background=transparent' is in query params.
 * Adds CSS classes and sets background styles on root, body, and gallery sections.
 */
const applyTransparentBackground = (params: URLSearchParams): void => {
  const root = document.documentElement;
  const body = document.body;
  const isTransparent = params.get('background') === 'transparent';

  body.classList.toggle('embed-transparent', isTransparent);
  const bgValue = isTransparent ? 'transparent' : '';
  root.style.background = bgValue;
  body.style.background = bgValue;

  for (const section of document.querySelectorAll('.gallery-section')) {
    section.classList.toggle('gallery-section--transparent', isTransparent);
  }
};

/**
 * Applies typography colors from the 'typographyColor' query parameter.
 * Supports preset values (light, dark, white, black) or custom color values.
 * Automatically derives description color from title color if using custom values.
 */
const applyTypographyColors = (params: URLSearchParams): void => {
  const root = document.documentElement;
  const typographyParam = params.get('typographyColor');

  if (!typographyParam) {
    setCSSVar(root, '--typography-color-title', null);
    setCSSVar(root, '--typography-color-description', null);
    return;
  }

  const normalized = typographyParam.toLowerCase().trim();
  const preset = TYPOGRAPHY_MODERN_THEME_PRESETS[normalized];

  if (preset) {
    setCSSVar(root, '--typography-color-title', preset.title);
    setCSSVar(root, '--typography-color-description', preset.description);
    return;
  }

  const color = parseColor(typographyParam);
  if (color) {
    setCSSVar(root, '--typography-color-title', color);
    setCSSVar(root, '--typography-color-description', deriveDescriptionColor(color));
  } else {
    setCSSVar(root, '--typography-color-title', null);
    setCSSVar(root, '--typography-color-description', null);
  }
};

/**
 * Applies section background colors from query parameters.
 * Sets CSS variables for general, even, and odd section background colors.
 */
const applySectionBackgroundColors = (params: URLSearchParams): void => {
  const root = document.documentElement;
  setCSSVar(root, '--section-bg-color', parseColor(params.get('sectionBgColor')));
  setCSSVar(root, '--section-bg-color-even', parseColor(params.get('sectionBgColorEven')));
  setCSSVar(root, '--section-bg-color-odd', parseColor(params.get('sectionBgColorOdd')));
};

/**
 * Applies hero height from the 'heroHeight' query parameter.
 * Accepts a number (e.g., '100' for 100vh, '50' for 50vh).
 */
const applyHeroHeight = (params: URLSearchParams): void => {
  const value = params.get('heroHeight')?.trim();
  const height = value && /^\d+(\.\d+)?$/.test(value) ? `${value}vh` : null;
  setCSSVar(document.documentElement, '--hero-height', height);
};

/**
 * Main function that applies all query parameter configurations to the page.
 * Reads URL search params and applies header visibility, background, typography, and section colors.
 */
export const applyQueryParams = (): void => {
  const params = new URLSearchParams(globalThis.location.search);

  applyHeaderImageVisibility(params);
  applyTransparentBackground(params);
  applyTypographyColors(params);
  applySectionBackgroundColors(params);
  applyHeroHeight(params);
};

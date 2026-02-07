/**
 * CSS utility functions for client-side theming and color manipulation.
 * These utilities are browser-only and require DOM access.
 */

/**
 * Normalizes hex color values to 6-digit format (e.g., #abc -> #aabbcc).
 * Returns null if the hex value is invalid.
 *
 * @param hex - The hex color value to normalize (with or without #)
 * @returns The normalized 6-digit hex color with # prefix, or null if invalid
 */
export function normalizeHex(hex: string): string | null {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  return hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex) ? `#${hex}` : null;
}

/**
 * Parses and validates a color value.
 * Supports CSS color names, hex values, rgb/rgba, and 'transparent'.
 * Returns null if the color is invalid.
 *
 * @param colorParam - The color string to parse
 * @returns The validated color string, or null if invalid
 */
export function parseColor(colorParam: string | null): string | null {
  if (!colorParam) return null;
  const normalized = colorParam.toLowerCase().trim();
  if (normalized === 'transparent') return 'transparent';

  const testEl = document.createElement('div');
  testEl.style.color = normalized;
  if (testEl.style.color) return normalized;

  return normalizeHex(colorParam);
}

/**
 * Sets or removes a CSS custom property (variable) on an element.
 * Removes the property if value is null.
 *
 * @param element - The HTML element to modify
 * @param name - The CSS variable name (e.g., '--my-color')
 * @param value - The value to set, or null to remove
 */
export function setCSSVar(element: HTMLElement, name: string, value: string | null): void {
  if (value) {
    element.style.setProperty(name, value);
  } else {
    element.style.removeProperty(name);
  }
}

/**
 * Derives a color with adjusted opacity from an existing color.
 * Converts rgb to rgba if needed, or adjusts existing rgba opacity.
 *
 * @param color - The source color (rgb, rgba, or other CSS color)
 * @param opacity - The target opacity (0-1)
 * @returns The color with adjusted opacity, or original if not rgb/rgba
 */
export function deriveOpacityColor(color: string, opacity: number): string {
  if (color.startsWith('rgba')) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${opacity})`);
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  return color;
}

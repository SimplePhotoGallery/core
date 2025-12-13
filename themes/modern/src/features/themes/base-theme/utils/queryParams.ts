// Normalize hex color (handles 3-digit, 6-digit, with/without #)
function normalizeHex(hex: string): string | null {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  return hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex) ? `#${hex}` : null;
}

// Check if string is a valid CSS color
function isValidColor(color: string): boolean {
  const testEl = document.createElement('div');
  testEl.style.color = color;
  return !!testEl.style.color;
}

// Parse color param (transparent keyword, rgba/rgb, or hex)
function parseColor(colorParam: string | null): string | null {
  if (!colorParam) return null;
  const normalized = colorParam.toLowerCase().trim();
  if (normalized === 'transparent') return 'transparent';
  if (isValidColor(normalized)) return normalized;
  return normalizeHex(colorParam);
}

// Set or remove CSS custom property
function setCSSVar(root: HTMLElement, name: string, value: string | null): void {
  if (value) {
    root.style.setProperty(name, value);
  } else {
    root.style.removeProperty(name);
  }
}

// Main function to apply all query params
export function applyQueryParams(): void {
  const params = new URLSearchParams(globalThis.location.search);
  const root = document.documentElement;
  const body = document.body;

  // Header image visibility
  const heroSection = document.querySelector<HTMLElement>('.hero');
  if (heroSection) {
    const headerImageParam = params.get('headerImage');
    heroSection.style.display = headerImageParam === 'false' || headerImageParam === '0' ? 'none' : '';
  }

  // Transparent background
  const isTransparent = params.get('background') === 'transparent';
  body.classList.toggle('embed-transparent', isTransparent);
  const bgValue = isTransparent ? 'transparent' : '';
  root.style.background = bgValue;
  body.style.background = bgValue;
  for (const section of document.querySelectorAll('.gallery-section')) {
    section.classList.toggle('gallery-section--transparent', isTransparent);
  }

  // Typography color
  const typographyColorParam = params.get('typographyColor');
  if (typographyColorParam) {
    const normalized = typographyColorParam.toLowerCase().trim();
    if (normalized === 'light' || normalized === 'white') {
      setCSSVar(root, '--typography-color-title', 'rgba(255, 255, 255, 0.95)');
      setCSSVar(root, '--typography-color-description', 'rgba(255, 255, 255, 0.75)');
    } else if (normalized === 'dark' || normalized === 'black') {
      setCSSVar(root, '--typography-color-title', '#111827');
      setCSSVar(root, '--typography-color-description', '#6b7280');
    } else {
      const color = parseColor(typographyColorParam);
      if (color) {
        setCSSVar(root, '--typography-color-title', color);
        // Create description color: if rgba, adjust opacity; if rgb, convert to rgba; otherwise use as-is
        let descColor = color;
        if (color.startsWith('rgba')) {
          descColor = color.replace(/,\s*[\d.]+\)$/, ', 0.8)');
        } else if (color.startsWith('rgb')) {
          descColor = color.replace('rgb', 'rgba').replace(')', ', 0.8)');
        }
        setCSSVar(root, '--typography-color-description', descColor);
      } else {
        setCSSVar(root, '--typography-color-title', null);
        setCSSVar(root, '--typography-color-description', null);
      }
    }
  } else {
    setCSSVar(root, '--typography-color-title', null);
    setCSSVar(root, '--typography-color-description', null);
  }

  // Section background colors
  setCSSVar(root, '--section-bg-color', parseColor(params.get('sectionBgColor')));
  setCSSVar(root, '--section-bg-color-even', parseColor(params.get('sectionBgColorEven')));
  setCSSVar(root, '--section-bg-color-odd', parseColor(params.get('sectionBgColorOdd')));
}

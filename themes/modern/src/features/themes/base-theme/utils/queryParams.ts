// Normalize hex color (handles 3-digit, 6-digit, with/without #)
function normalizeHex(hex: string): string | null {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  return hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex) ? `#${hex}` : null;
}

// Parse color param (transparent keyword or hex)
function parseColor(colorParam: string | null): string | null {
  if (!colorParam) return null;
  const normalized = colorParam.toLowerCase();
  return normalized === 'transparent' ? 'transparent' : normalizeHex(colorParam);
}

// Set or remove CSS custom property
function setCSSVar(root: HTMLElement, name: string, value: string | null): void {
  if (value) root.style.setProperty(name, value);
  else root.style.removeProperty(name);
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
  const backgroundParam = params.get('background');
  const isTransparent = backgroundParam === 'transparent';
  body.classList.toggle('embed-transparent', isTransparent);
  root.style.background = isTransparent ? 'transparent' : '';
  body.style.background = isTransparent ? 'transparent' : '';
  for (const section of document.querySelectorAll('.gallery-section')) {
    section.classList.toggle('gallery-section--transparent', isTransparent);
  }

  // Typography color
  const typographyColorParam = params.get('typographyColor');
  if (typographyColorParam) {
    const normalized = typographyColorParam.toLowerCase();
    if (normalized === 'light' || normalized === 'white') {
      setCSSVar(root, '--typography-color-title', 'rgba(255, 255, 255, 0.95)');
      setCSSVar(root, '--typography-color-description', 'rgba(255, 255, 255, 0.75)');
    } else if (normalized === 'dark' || normalized === 'black') {
      setCSSVar(root, '--typography-color-title', '#111827');
      setCSSVar(root, '--typography-color-description', '#6b7280');
    } else {
      // Try hex color
      const hex = normalizeHex(typographyColorParam);
      if (hex) {
        const r = Number.parseInt(hex.slice(1, 3), 16);
        const g = Number.parseInt(hex.slice(3, 5), 16);
        const b = Number.parseInt(hex.slice(5, 7), 16);
        setCSSVar(root, '--typography-color-title', `rgb(${r}, ${g}, ${b})`);
        setCSSVar(root, '--typography-color-description', `rgba(${r}, ${g}, ${b}, 0.8)`);
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

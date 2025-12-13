// Preset typography color themes
const TYPOGRAPHY_PRESETS: Record<string, { title: string; description: string }> = {
  light: { title: 'rgba(255, 255, 255, 0.95)', description: 'rgba(255, 255, 255, 0.75)' },
  white: { title: 'rgba(255, 255, 255, 0.95)', description: 'rgba(255, 255, 255, 0.75)' },
  dark: { title: '#111827', description: '#6b7280' },
  black: { title: '#111827', description: '#6b7280' },
};

const normalizeHex = (hex: string): string | null => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  return hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex) ? `#${hex}` : null;
};

const parseColor = (colorParam: string | null): string | null => {
  if (!colorParam) return null;
  const normalized = colorParam.toLowerCase().trim();
  if (normalized === 'transparent') return 'transparent';

  const testEl = document.createElement('div');
  testEl.style.color = normalized;
  if (testEl.style.color) return normalized;

  return normalizeHex(colorParam);
};

const setCSSVar = (root: HTMLElement, name: string, value: string | null): void => {
  if (value) {
    root.style.setProperty(name, value);
  } else {
    root.style.removeProperty(name);
  }
};

const deriveDescriptionColor = (titleColor: string): string => {
  if (titleColor.startsWith('rgba')) {
    return titleColor.replace(/,\s*[\d.]+\)$/, ', 0.8)');
  }
  if (titleColor.startsWith('rgb')) {
    return titleColor.replace('rgb', 'rgba').replace(')', ', 0.8)');
  }
  return titleColor;
};

export const applyQueryParams = (): void => {
  const params = new URLSearchParams(globalThis.location.search);
  const root = document.documentElement;
  const body = document.body;

  // Header image visibility
  const heroSection = document.querySelector<HTMLElement>('.hero');
  if (heroSection) {
    const headerImage = params.get('headerImage');
    heroSection.style.display = headerImage === 'false' || headerImage === '0' ? 'none' : '';
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

  // Typography colors
  const typographyParam = params.get('typographyColor');
  if (typographyParam) {
    const normalized = typographyParam.toLowerCase().trim();
    const preset = TYPOGRAPHY_PRESETS[normalized];

    if (preset) {
      setCSSVar(root, '--typography-color-title', preset.title);
      setCSSVar(root, '--typography-color-description', preset.description);
    } else {
      const color = parseColor(typographyParam);
      if (color) {
        setCSSVar(root, '--typography-color-title', color);
        setCSSVar(root, '--typography-color-description', deriveDescriptionColor(color));
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
};

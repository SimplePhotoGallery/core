import { galleryUiCatalogs, galleryUiLocaleNames } from './catalogs';

import type { GalleryUiLocale, GalleryUiMessage } from './catalogs';

export const availableGalleryUiLocales = Object.keys(galleryUiCatalogs) as GalleryUiLocale[];

export function matchGalleryUiLocale(value: unknown): GalleryUiLocale | undefined {
  if (typeof value !== 'string' || value.length > 128) return;
  try {
    const { language, script, region } = new Intl.Locale(value.replaceAll('_', '-'));
    if (language === 'zh')
      return script === 'Hant' || (!script && ['TW', 'HK', 'MO'].includes(region ?? '')) ? 'zh-Hant' : 'zh-Hans';
    if (language === 'pt') return 'pt-BR';
    if (Object.prototype.hasOwnProperty.call(galleryUiLocaleNames, language)) return language as GalleryUiLocale;
  } catch {
    /* Invalid values never become DOM attributes or translation keys. */
  }
}

export function resolveGalleryUiLocale(preferences: readonly unknown[]): GalleryUiLocale {
  for (const value of preferences) {
    const locale = matchGalleryUiLocale(value);
    if (locale && galleryUiCatalogs[locale]) return locale;
  }
  return 'en';
}

export function galleryUiText(
  message: GalleryUiMessage,
  locale: GalleryUiLocale,
  values: Record<string, string | number> = {},
) {
  const text = galleryUiCatalogs[locale]?.[message] ?? galleryUiCatalogs.en![message] ?? message;
  return text.replaceAll(/{{(\w+)}}/g, (token, name: string) => {
    const value = values[name];
    if (value === undefined) return token;
    return typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : value;
  });
}

export function isGalleryUiMessage(value: unknown): value is GalleryUiMessage {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(galleryUiCatalogs.en, value);
}

export { galleryUiLocaleNames, type GalleryUiLocale, type GalleryUiMessage } from './catalogs';

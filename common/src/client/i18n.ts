import {
  availableGalleryUiLocales,
  galleryUiLocaleNames,
  galleryUiText,
  isGalleryUiMessage,
  resolveGalleryUiLocale,
} from '../i18n';

import type { GalleryUiLocale } from '../i18n';

export const GALLERY_UI_LOCALE_EVENT = 'spg:ui-locale-change';
const storageKey = 'spg.ui_locale';
let activeLocale: GalleryUiLocale | undefined;
let initialized = false;

export function getGalleryUiLocale(preferred?: unknown): GalleryUiLocale {
  let saved: string | null = null;
  let query: string | null = null;
  if (globalThis.window !== undefined) {
    query = new URL(globalThis.location.href).searchParams.get('ui_locale');
    try {
      saved = globalThis.localStorage.getItem(storageKey);
    } catch {
      /* Storage may be unavailable in embedded galleries. */
    }
  }
  return resolveGalleryUiLocale([
    preferred,
    activeLocale,
    query,
    saved,
    ...(typeof navigator === 'undefined' ? [] : navigator.languages),
  ]);
}

/** Update explicitly marked product chrome, never gallery titles, captions or media. */
export function localizeGalleryChrome(locale: GalleryUiLocale) {
  for (const element of document.querySelectorAll<HTMLElement>('[data-spg-ui-chrome]')) {
    element.lang = locale;
    element.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }
  for (const element of document.querySelectorAll<HTMLElement>('[data-spg-ui]')) {
    const key = element.dataset.spgUi;
    if (!isGalleryUiMessage(key)) continue;
    const text = galleryUiText(key, locale);
    if (typeof text !== 'string') continue;
    const brand = element.querySelector('[data-spg-brand]');
    if (brand && key === 'Created with {{brand}}') {
      const parts = text.split('{{brand}}');
      element.replaceChildren(document.createTextNode(parts[0]), brand, document.createTextNode(parts[1] ?? ''));
    } else element.textContent = text;
    element.lang = locale;
  }
  for (const element of document.querySelectorAll<HTMLElement>('[data-spg-ui-label]')) {
    const key = element.dataset.spgUiLabel;
    if (!isGalleryUiMessage(key)) continue;
    const text = galleryUiText(key, locale);
    if (typeof text === 'string') element.setAttribute('aria-label', text);
    element.lang = locale;
  }
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-spg-marketing-link]')) {
    link.href = `https://simple.photo/${locale === 'en' ? '' : `${locale}/`}`;
  }
  for (const select of document.querySelectorAll<HTMLSelectElement>('select[data-spg-ui-language]')) {
    if (select.options.length !== availableGalleryUiLocales.length) {
      select.replaceChildren(
        ...availableGalleryUiLocales.map((value) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = galleryUiLocaleNames[value];
          option.lang = value;
          return option;
        }),
      );
    }
    select.value = locale;
  }
}

export function setGalleryUiLocale(value: unknown) {
  const locale = resolveGalleryUiLocale([value]);
  activeLocale = locale;
  try {
    globalThis.localStorage.setItem(storageKey, locale);
  } catch {
    /* Keep the current page working without storage. */
  }
  localizeGalleryChrome(locale);
  globalThis.dispatchEvent(new CustomEvent(GALLERY_UI_LOCALE_EVENT, { detail: { locale } }));
  return locale;
}

export function initializeGalleryUi(preferred?: unknown) {
  const locale = getGalleryUiLocale(preferred);
  activeLocale = locale;
  localizeGalleryChrome(locale);
  if (!initialized) {
    initialized = true;
    document.addEventListener('change', (event) => {
      if (event.target instanceof HTMLSelectElement && event.target.dataset.spgUiLanguage !== undefined)
        setGalleryUiLocale(event.target.value);
    });
  }
  return locale;
}

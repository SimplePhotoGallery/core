import ar from './messages/ar.json';
import bg from './messages/bg.json';
import de from './messages/de.json';
import en from './messages/en.json';
import es from './messages/es.json';
import fr from './messages/fr.json';
import hi from './messages/hi.json';
import id from './messages/id.json';
import it from './messages/it.json';
import ja from './messages/ja.json';
import ko from './messages/ko.json';
import ptBR from './messages/pt-BR.json';
import tr from './messages/tr.json';
import zhHans from './messages/zh-Hans.json';
import zhHant from './messages/zh-Hant.json';

export const galleryUiLocaleNames = {
  en: 'English',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  it: 'Italiano',
  ko: '한국어',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  ar: 'العربية',
  hi: 'हिन्दी',
  id: 'Bahasa Indonesia',
  tr: 'Türkçe',
  bg: 'Български',
} as const;
export type GalleryUiLocale = keyof typeof galleryUiLocaleNames;
export type GalleryUiMessage = keyof typeof en;
export const galleryUiCatalogs: Partial<Record<GalleryUiLocale, Record<GalleryUiMessage, string>>> = {
  en,
  es: es,
  'pt-BR': ptBR,
  fr: fr,
  de: de,
  ja: ja,
  it: it,
  ko: ko,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  ar: ar,
  hi: hi,
  id: id,
  tr: tr,
  bg: bg,
};

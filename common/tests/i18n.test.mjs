import assert from 'node:assert/strict';
import test from 'node:test';

import { availableGalleryUiLocales, galleryUiText, matchGalleryUiLocale, resolveGalleryUiLocale } from '../dist/client.js';

test('locale negotiation recognizes region/script preferences and rejects invalid values', () => {
  assert.equal(availableGalleryUiLocales.length, 15);
  for (const [input, expected] of [
    ['pt-PT', 'pt-BR'],
    ['zh-TW', 'zh-Hant'],
    ['zh-Hans-TW', 'zh-Hans'],
    ['bg_BG', 'bg'],
    ['ar-EG', 'ar'],
  ])
    assert.equal(matchGalleryUiLocale(input), expected);
  assert.equal(matchGalleryUiLocale('<script>'), undefined);
  assert.equal(resolveGalleryUiLocale(['unknown', 'ko-KR', 'en']), 'ko');
  assert.equal(resolveGalleryUiLocale(['unknown']), 'en');
});
test('all locales have translated controls and preserve interpolation values as plain text', () => {
  for (const locale of availableGalleryUiLocales) {
    assert.ok(galleryUiText('Close', locale));
    const brand = '<USER 日本語 & العربية>';
    assert.ok(galleryUiText('Created with {{brand}}', locale, { brand }).includes(brand));
    const counter = galleryUiText('Item {{current}} of {{total}}', locale, { current: 2, total: 1200 });
    assert.ok(counter.includes(new Intl.NumberFormat(locale).format(1200)));
    assert.ok(!counter.includes('{{'));
  }
});

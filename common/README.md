# @simple-photo-gallery/common

Shared utilities and types for Simple Photo Gallery themes and CLI.

## Installation

```bash
npm install @simple-photo-gallery/common
```

## Package Exports

- `.` - Gallery types and Zod validation schemas
- `./theme` - Theme utilities for data loading and resolution
- `./client` - Browser-side utilities (PhotoSwipe, blurhash, CSS)
- `./styles/photoswipe` - PhotoSwipe CSS bundle

## Public gallery languages

The browser helpers include product copy for `en`, `es`, `pt-BR`, `fr`, `de`,
`ja`, `it`, `ko`, `zh-Hans`, `zh-Hant`, `ar`, `hi`, `id`, `tr`, and `bg`.
The modern theme and new-theme scaffold use these catalogs for the footer,
language selector, call to action, scroll label, and PhotoSwipe controls/errors.

```ts
import { initializeGalleryUi, createGalleryLightbox } from '@simple-photo-gallery/common/client';

initializeGalleryUi();
const lightbox = await createGalleryLightbox();
lightbox.init();
```

The initial preference is an explicit helper option, then `?ui_locale=`, the
saved `spg.ui_locale` browser preference, browser languages, and English.
Only supported, validated locales are used. Portuguese variants use Brazilian
Portuguese; Chinese script or region selects Simplified or Traditional Chinese.
The selector updates an open lightbox without navigation and stores its choice
when browser storage is available.

Only product elements explicitly marked with `data-spg-ui` or
`data-spg-ui-label` are translated. Mark product sections with
`data-spg-ui-chrome` for language/direction attributes. Gallery titles,
descriptions, captions, image order, and `metadata.language` remain unchanged.
Arabic product sections use RTL; photo-navigation geometry stays stable.
Custom themes can call `galleryUiText`, `setGalleryUiLocale`, or listen for
`spg:ui-locale-change`. Destroying a lightbox removes its locale listener.

Existing generated HTML needs a normal gallery rebuild to receive the new
controls. Localized marketing links depend on the companion website's locale
routes. The `2.3.0-i18n.0` versions are review artifacts; publishing remains the
repository's tagged GitHub Actions release process.

Run `yarn ci` and `yarn release:check` from the workspace root. The locale gate
checks all 15 catalogs, exact message keys, and interpolation placeholders.

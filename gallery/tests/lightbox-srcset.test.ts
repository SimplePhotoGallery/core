import { GalleryDataSchema } from '../../common/src/gallery';
import { resolveGalleryData } from '../../common/src/theme';

describe('lightbox responsive images', () => {
  test('validates and resolves media srcset data', async () => {
    const srcset = 'https://cdn.example/photo-1280.avif 1280w, https://cdn.example/photo-1920.avif 1920w';
    const galleryData = GalleryDataSchema.parse({
      title: 'Gallery',
      description: '',
      headerImage: 'hero.jpg',
      metadata: {},
      subGalleries: {
        title: '',
        galleries: [],
      },
      sections: [
        {
          images: [
            {
              type: 'image',
              filename: 'photo.jpg',
              width: 4000,
              height: 3000,
              srcset,
            },
          ],
        },
      ],
    });

    const resolved = await resolveGalleryData(galleryData);

    expect(resolved.sections[0].images[0].srcset).toBe(srcset);
  });
});

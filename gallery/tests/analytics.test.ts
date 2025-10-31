import { GalleryDataSchema } from '@simple-photo-gallery/common';

describe('Analytics Script', () => {
  test('should allow optional analyticsScript field in gallery.json', () => {
    const galleryData = {
      title: 'Test Gallery',
      description: 'Test description',
      headerImage: 'test.jpg',
      metadata: {},
      sections: [
        {
          images: [],
        },
      ],
      subGalleries: {
        title: 'Sub Galleries',
        galleries: [],
      },
      analyticsScript: '<script>console.log("analytics")</script>',
    };

    // Should not throw with analyticsScript
    expect(() => GalleryDataSchema.parse(galleryData)).not.toThrow();
    const validatedData = GalleryDataSchema.parse(galleryData);
    expect(validatedData.analyticsScript).toBe('<script>console.log("analytics")</script>');
  });

  test('should allow gallery.json without analyticsScript field', () => {
    const galleryData = {
      title: 'Test Gallery',
      description: 'Test description',
      headerImage: 'test.jpg',
      metadata: {},
      sections: [
        {
          images: [],
        },
      ],
      subGalleries: {
        title: 'Sub Galleries',
        galleries: [],
      },
    };

    // Should not throw without analyticsScript
    expect(() => GalleryDataSchema.parse(galleryData)).not.toThrow();
    const validatedData = GalleryDataSchema.parse(galleryData);
    expect(validatedData.analyticsScript).toBeUndefined();
  });
});

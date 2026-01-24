import { extractThumbnailConfigFromGallery, mergeThumbnailConfig } from '../../common/src/theme/config';

describe('Theme Configuration', () => {
  describe('mergeThumbnailConfig', () => {
    test('should prefer gallery config over theme config', () => {
      const result = mergeThumbnailConfig({ size: 400, edge: 'width' }, { size: 300, edge: 'auto' });

      expect(result.size).toBe(400);
      expect(result.edge).toBe('width');
    });

    test('should fall back to theme config when gallery config is empty', () => {
      const result = mergeThumbnailConfig({}, { size: 350, edge: 'height' });

      expect(result.size).toBe(350);
      expect(result.edge).toBe('height');
    });

    test('should use defaults when both configs are empty', () => {
      const result = mergeThumbnailConfig({}, {});

      expect(result.size).toBe(300);
      expect(result.edge).toBe('auto');
    });

    test('should use defaults when no configs are provided', () => {
      const result = mergeThumbnailConfig();

      expect(result.size).toBe(300);
      expect(result.edge).toBe('auto');
    });

    test('should merge partial gallery config with theme config', () => {
      const result = mergeThumbnailConfig({ size: 500 }, { size: 300, edge: 'height' });

      expect(result.size).toBe(500);
      expect(result.edge).toBe('height');
    });

    test('should merge partial gallery config with defaults', () => {
      const result = mergeThumbnailConfig({ edge: 'width' }, {});

      expect(result.size).toBe(300);
      expect(result.edge).toBe('width');
    });

    test('should handle undefined gallery config', () => {
      const result = mergeThumbnailConfig(undefined, { size: 400, edge: 'height' });

      expect(result.size).toBe(400);
      expect(result.edge).toBe('height');
    });

    test('should handle undefined theme config', () => {
      const result = mergeThumbnailConfig({ size: 250, edge: 'auto' });

      expect(result.size).toBe(250);
      expect(result.edge).toBe('auto');
    });

    test('should handle both configs as undefined', () => {
      const result = mergeThumbnailConfig();

      expect(result.size).toBe(300);
      expect(result.edge).toBe('auto');
    });

    test('should respect the three-tier hierarchy', () => {
      const galleryConfig = { size: 450 };
      const themeConfig = { size: 350, edge: 'height' as const };

      const result = mergeThumbnailConfig(galleryConfig, themeConfig);

      expect(result.size).toBe(450);
      expect(result.edge).toBe('height');
    });
  });

  describe('extractThumbnailConfigFromGallery', () => {
    test('should extract thumbnail config from gallery data', () => {
      const gallery = {
        thumbnails: {
          size: 400,
          edge: 'width' as const,
        },
      };

      const result = extractThumbnailConfigFromGallery(gallery);

      expect(result.size).toBe(400);
      expect(result.edge).toBe('width');
    });

    test('should return empty config when thumbnails is undefined', () => {
      const gallery = {};

      const result = extractThumbnailConfigFromGallery(gallery);

      expect(result.size).toBeUndefined();
      expect(result.edge).toBeUndefined();
    });

    test('should extract partial thumbnail config', () => {
      const gallery = {
        thumbnails: {
          size: 350,
        },
      };

      const result = extractThumbnailConfigFromGallery(gallery);

      expect(result.size).toBe(350);
      expect(result.edge).toBeUndefined();
    });

    test('should extract only edge when size is not specified', () => {
      const gallery = {
        thumbnails: {
          edge: 'height' as const,
        },
      };

      const result = extractThumbnailConfigFromGallery(gallery);

      expect(result.size).toBeUndefined();
      expect(result.edge).toBe('height');
    });

    test('should handle empty thumbnails object', () => {
      const gallery = {
        thumbnails: {},
      };

      const result = extractThumbnailConfigFromGallery(gallery);

      expect(result.size).toBeUndefined();
      expect(result.edge).toBeUndefined();
    });
  });

  describe('Integration: Extract + Merge', () => {
    test('should correctly merge extracted gallery config with theme config', () => {
      const gallery = {
        thumbnails: {
          size: 500,
        },
      };

      const themeConfig = { size: 300, edge: 'height' as const };

      const galleryConfig = extractThumbnailConfigFromGallery(gallery);
      const result = mergeThumbnailConfig(galleryConfig, themeConfig);

      expect(result.size).toBe(500);
      expect(result.edge).toBe('height');
    });

    test('should use theme config when gallery has no thumbnail settings', () => {
      const gallery = {};
      const themeConfig = { size: 400, edge: 'width' as const };

      const galleryConfig = extractThumbnailConfigFromGallery(gallery);
      const result = mergeThumbnailConfig(galleryConfig, themeConfig);

      expect(result.size).toBe(400);
      expect(result.edge).toBe('width');
    });

    test('should use defaults when neither gallery nor theme has settings', () => {
      const gallery = {};

      const galleryConfig = extractThumbnailConfigFromGallery(gallery);
      const result = mergeThumbnailConfig(galleryConfig);

      expect(result.size).toBe(300);
      expect(result.edge).toBe('auto');
    });
  });
});

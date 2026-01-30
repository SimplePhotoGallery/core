import { extractThumbnailConfigFromGallery, mergeThumbnailConfig } from '../../common/src/theme/config';

describe('Theme Configuration', () => {
  describe('mergeThumbnailConfig', () => {
    test('should prefer CLI config over gallery and theme config', () => {
      const result = mergeThumbnailConfig(
        { size: 500, edge: 'height' },
        { size: 400, edge: 'width' },
        { size: 300, edge: 'auto' },
      );

      expect(result.size).toBe(500);
      expect(result.edge).toBe('height');
    });

    test('should prefer gallery config over theme config when CLI is empty', () => {
      const result = mergeThumbnailConfig(undefined, { size: 400, edge: 'width' }, { size: 300, edge: 'auto' });

      expect(result.size).toBe(400);
      expect(result.edge).toBe('width');
    });

    test('should fall back to theme config when CLI and gallery config are empty', () => {
      const result = mergeThumbnailConfig(undefined, {}, { size: 350, edge: 'height' });

      expect(result.size).toBe(350);
      expect(result.edge).toBe('height');
    });

    test('should use defaults when all configs are empty', () => {
      const result = mergeThumbnailConfig({}, {}, {});

      expect(result.size).toBe(300);
      expect(result.edge).toBe('auto');
    });

    test('should use defaults when no configs are provided', () => {
      const result = mergeThumbnailConfig();

      expect(result.size).toBe(300);
      expect(result.edge).toBe('auto');
    });

    test('should merge partial CLI config with gallery and theme config', () => {
      const result = mergeThumbnailConfig({ size: 600 }, { edge: 'width' }, { size: 300, edge: 'height' });

      expect(result.size).toBe(600);
      expect(result.edge).toBe('width');
    });

    test('should merge partial gallery config with theme config', () => {
      const result = mergeThumbnailConfig(undefined, { size: 500 }, { size: 300, edge: 'height' });

      expect(result.size).toBe(500);
      expect(result.edge).toBe('height');
    });

    test('should merge partial gallery config with defaults', () => {
      const result = mergeThumbnailConfig(undefined, { edge: 'width' }, {});

      expect(result.size).toBe(300);
      expect(result.edge).toBe('width');
    });

    test('should handle undefined CLI config', () => {
      const result = mergeThumbnailConfig(undefined, { size: 400, edge: 'height' });

      expect(result.size).toBe(400);
      expect(result.edge).toBe('height');
    });

    test('should handle undefined gallery config', () => {
      const result = mergeThumbnailConfig(undefined, undefined, { size: 400, edge: 'height' });

      expect(result.size).toBe(400);
      expect(result.edge).toBe('height');
    });

    test('should handle undefined theme config', () => {
      const result = mergeThumbnailConfig(undefined, { size: 250, edge: 'auto' });

      expect(result.size).toBe(250);
      expect(result.edge).toBe('auto');
    });

    test('should handle all configs as undefined', () => {
      const result = mergeThumbnailConfig();

      expect(result.size).toBe(300);
      expect(result.edge).toBe('auto');
    });

    test('should respect the four-tier hierarchy', () => {
      const result = mergeThumbnailConfig({ size: 550 }, { size: 450, edge: 'width' }, { size: 350, edge: 'height' });

      expect(result.size).toBe(550);
      expect(result.edge).toBe('width');
    });

    test('should fall through hierarchy correctly for each field', () => {
      const result = mergeThumbnailConfig({ size: 600 }, { edge: 'width' }, { size: 300, edge: 'height' });

      expect(result.size).toBe(600);
      expect(result.edge).toBe('width');
    });
  });

  describe('extractThumbnailConfigFromGallery', () => {
    test('should extract thumbnail config from gallery data', () => {
      const result = extractThumbnailConfigFromGallery({ thumbnails: { size: 400, edge: 'width' } });

      expect(result.size).toBe(400);
      expect(result.edge).toBe('width');
    });

    test('should return empty config when thumbnails is undefined', () => {
      const result = extractThumbnailConfigFromGallery({});

      expect(result.size).toBeUndefined();
      expect(result.edge).toBeUndefined();
    });

    test('should extract partial thumbnail config', () => {
      const result = extractThumbnailConfigFromGallery({ thumbnails: { size: 350 } });

      expect(result.size).toBe(350);
      expect(result.edge).toBeUndefined();
    });

    test('should extract only edge when size is not specified', () => {
      const result = extractThumbnailConfigFromGallery({ thumbnails: { edge: 'height' } });

      expect(result.size).toBeUndefined();
      expect(result.edge).toBe('height');
    });

    test('should handle empty thumbnails object', () => {
      const result = extractThumbnailConfigFromGallery({ thumbnails: {} });

      expect(result.size).toBeUndefined();
      expect(result.edge).toBeUndefined();
    });
  });

  describe('Integration: Extract + Merge', () => {
    test('should correctly merge extracted gallery config with theme config', () => {
      const galleryConfig = extractThumbnailConfigFromGallery({ thumbnails: { size: 500 } });
      const result = mergeThumbnailConfig(undefined, galleryConfig, { size: 300, edge: 'height' });

      expect(result.size).toBe(500);
      expect(result.edge).toBe('height');
    });

    test('should use theme config when gallery has no thumbnail settings', () => {
      const galleryConfig = extractThumbnailConfigFromGallery({});
      const result = mergeThumbnailConfig(undefined, galleryConfig, { size: 400, edge: 'width' });

      expect(result.size).toBe(400);
      expect(result.edge).toBe('width');
    });

    test('should use defaults when neither gallery nor theme has settings', () => {
      const galleryConfig = extractThumbnailConfigFromGallery({});
      const result = mergeThumbnailConfig(undefined, galleryConfig);

      expect(result.size).toBe(300);
      expect(result.edge).toBe('auto');
    });

    test('should allow CLI to override extracted gallery config', () => {
      const galleryConfig = extractThumbnailConfigFromGallery({ thumbnails: { size: 400, edge: 'width' } });
      const result = mergeThumbnailConfig({ size: 600 }, galleryConfig, { size: 300, edge: 'height' });

      expect(result.size).toBe(600);
      expect(result.edge).toBe('width');
    });
  });
});

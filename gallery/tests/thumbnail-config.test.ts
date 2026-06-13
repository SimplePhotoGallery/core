import { getThumbnailExtension, mergeThumbnailConfig } from '../../common/src/theme/config';
import { buildCliThumbnailConfig, parseThumbnailFormat } from '../src/utils';

describe('getThumbnailExtension', () => {
  test('should return the format name for avif and webp', () => {
    expect(getThumbnailExtension('avif')).toBe('avif');
    expect(getThumbnailExtension('webp')).toBe('webp');
  });

  test('should map jpeg to the jpg extension', () => {
    expect(getThumbnailExtension('jpeg')).toBe('jpg');
  });
});

describe('mergeThumbnailConfig with format, quality and effort', () => {
  test('should default to avif format with no quality or effort', () => {
    const result = mergeThumbnailConfig();
    expect(result.format).toBe('avif');
    expect(result.quality).toBeUndefined();
    expect(result.effort).toBeUndefined();
  });

  test('should resolve format with CLI > gallery > theme precedence', () => {
    const result = mergeThumbnailConfig({ format: 'webp' }, { format: 'jpeg' }, { format: 'avif' });
    expect(result.format).toBe('webp');
  });

  test('should fall back to gallery format when CLI does not set it', () => {
    const result = mergeThumbnailConfig({ size: 200 }, { format: 'jpeg' }, { format: 'avif' });
    expect(result.format).toBe('jpeg');
  });

  test('should resolve quality and effort across the hierarchy', () => {
    const result = mergeThumbnailConfig({ effort: 2 }, { quality: 70 }, { quality: 50, effort: 9 });
    expect(result.quality).toBe(70);
    expect(result.effort).toBe(2);
  });
});

describe('parseThumbnailFormat', () => {
  test('should accept the supported formats', () => {
    expect(parseThumbnailFormat('avif')).toBe('avif');
    expect(parseThumbnailFormat('webp')).toBe('webp');
    expect(parseThumbnailFormat('jpeg')).toBe('jpeg');
  });

  test('should throw for an unsupported format', () => {
    expect(() => parseThumbnailFormat('gif')).toThrow('Thumbnail format must be one of');
  });
});

describe('buildCliThumbnailConfig', () => {
  test('should return undefined when no thumbnail options are provided', () => {
    expect(buildCliThumbnailConfig({})).toBeUndefined();
  });

  test('should include only the provided options', () => {
    const config = buildCliThumbnailConfig({ thumbnailFormat: 'webp', thumbnailEffort: 3 });
    expect(config).toEqual({ format: 'webp', effort: 3 });
  });

  test('should map all thumbnail options to config keys', () => {
    const config = buildCliThumbnailConfig({
      thumbnailSize: 400,
      thumbnailEdge: 'width',
      thumbnailFormat: 'jpeg',
      thumbnailQuality: 80,
      thumbnailEffort: 5,
    });
    expect(config).toEqual({ size: 400, edge: 'width', format: 'jpeg', quality: 80, effort: 5 });
  });
});

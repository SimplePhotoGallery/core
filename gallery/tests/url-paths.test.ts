import path from 'node:path';

import { getRelativePath, getSubgalleryThumbnailPath, joinUrl, toUrlPath } from '@simple-photo-gallery/common/theme';

describe('toUrlPath', () => {
  test('should convert Windows backslashes to forward slashes', () => {
    expect(toUrlPath(String.raw`sub\dir\photo.jpg`)).toBe('sub/dir/photo.jpg');
  });

  test('should leave POSIX paths unchanged', () => {
    expect(toUrlPath('sub/dir/photo.jpg')).toBe('sub/dir/photo.jpg');
  });

  test('should handle empty strings', () => {
    expect(toUrlPath('')).toBe('');
  });
});

describe('joinUrl', () => {
  test('should join a base URL and a segment with a single slash', () => {
    expect(joinUrl('https://example.com/photos', 'japan')).toBe('https://example.com/photos/japan');
  });

  test('should not produce double slashes when the base URL has a trailing slash', () => {
    expect(joinUrl('https://example.com/photos/', 'japan')).toBe('https://example.com/photos/japan');
  });

  test('should return the trimmed base URL when no segments are provided', () => {
    expect(joinUrl('https://example.com/photos/')).toBe('https://example.com/photos');
  });

  test('should skip empty segments', () => {
    expect(joinUrl('https://example.com/photos', '')).toBe('https://example.com/photos');
  });

  test('should normalize Windows backslashes in segments', () => {
    expect(joinUrl('https://example.com/photos', String.raw`trips\japan`)).toBe('https://example.com/photos/trips/japan');
  });
});

describe('getSubgalleryThumbnailPath', () => {
  test('should build the thumbnail path from a resolved subgallery path', () => {
    expect(getSubgalleryThumbnailPath('photo.jpg', 'japan')).toBe('japan/gallery/images/photo.avif');
  });

  test('should use forward slashes when the resolved subgallery path contains backslashes', () => {
    expect(getSubgalleryThumbnailPath('photo.jpg', String.raw`trips\japan`)).toBe('trips/japan/gallery/images/photo.avif');
  });

  test('should fall back to the header image directory when no resolved path is provided', () => {
    expect(getSubgalleryThumbnailPath('japan/photo.jpg')).toBe('japan/gallery/images/photo.avif');
  });

  test('should replace the header image extension with .avif', () => {
    expect(getSubgalleryThumbnailPath('photo.png', 'japan')).toBe('japan/gallery/images/photo.avif');
  });
});

describe('getRelativePath', () => {
  test('should resolve a subgallery path relative to the gallery root', () => {
    const galleryJsonPath = path.join(path.sep, 'galleries', 'main', 'gallery', 'gallery.json');
    expect(getRelativePath(path.join('..', 'japan'), galleryJsonPath)).toBe('japan');
  });

  test('should return forward slashes for nested paths', () => {
    const galleryJsonPath = path.join(path.sep, 'galleries', 'main', 'gallery', 'gallery.json');
    expect(getRelativePath(path.join('..', 'trips', 'japan'), galleryJsonPath)).toBe('trips/japan');
  });
});

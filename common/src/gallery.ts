import { z } from 'zod';

/** Zod schema for thumbnail metadata including path and dimensions */
export const ThumbnailSchema = z.object({
  baseUrl: z.string().optional(),
  path: z.string(),
  pathRetina: z.string(),
  width: z.number(),
  height: z.number(),
  blurHash: z.string().optional(),
});

/** Zod schema for media file metadata including type, dimensions, and thumbnail info */
export const MediaFileSchema = z.object({
  type: z.enum(['image', 'video']),
  filename: z.string(),
  url: z.string().optional(),
  alt: z.string().optional(),
  width: z.number(),
  height: z.number(),
  thumbnail: ThumbnailSchema.optional(),
  lastMediaTimestamp: z.string().optional(),
});

/** Zod schema for media file with path (deprecated) */
export const MediaFileDeprecatedSchema = z.object({
  type: z.enum(['image', 'video']),
  path: z.string(),
  alt: z.string().optional(),
  width: z.number(),
  height: z.number(),
  thumbnail: ThumbnailSchema.optional(),
  lastMediaTimestamp: z.string().optional(),
});

/** Zod schema for a gallery section containing title, description, and media files */
export const GallerySectionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(MediaFileSchema),
});

/** Zod schema for a gallery section containing title, description, and media files (deprecated) */
export const GallerySectionDeprecatedSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(MediaFileDeprecatedSchema),
});

/** Zod schema for sub-gallery metadata including title, header image, and path */
export const SubGallerySchema = z.object({
  title: z.string(),
  headerImage: z.string(),
  path: z.string(),
});

/** Zod schema for complete gallery data including metadata, sections, and sub-galleries */
export const GalleryMetadataSchema = z.object({
  image: z.string().optional(),
  imageWidth: z.number().optional(),
  imageHeight: z.number().optional(),
  ogUrl: z.string().optional(),
  ogType: z.string().optional(),
  ogSiteName: z.string().optional(),
  twitterSite: z.string().optional(),
  twitterCreator: z.string().optional(),
  author: z.string().optional(),
  keywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  language: z.string().optional(),
  robots: z.string().optional(),
});

/** Zod schema for complete gallery data including metadata, sections, and sub-galleries */
export const GalleryDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  mediaBasePath: z.string().optional(),
  url: z.string().optional(),
  headerImage: z.string(),
  headerImageBlurHash: z.string().optional(),
  thumbnailSize: z.number().optional(),
  metadata: GalleryMetadataSchema,
  mediaBaseUrl: z.string().optional(),
  thumbsBaseUrl: z.string().optional(),
  analyticsScript: z.string().optional(),
  sections: z.array(GallerySectionSchema),
  subGalleries: z.object({ title: z.string(), galleries: z.array(SubGallerySchema) }),
});

/** Zod schema for complete gallery data without mediaBasePath (deprecated) */
export const GalleryDataDeprecatedSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().optional(),
  headerImage: z.string(),
  thumbnailSize: z.number().optional(),
  metadata: GalleryMetadataSchema,
  mediaBaseUrl: z.string().optional(),
  analyticsScript: z.string().optional(),
  sections: z.array(GallerySectionDeprecatedSchema),
  subGalleries: z.object({ title: z.string(), galleries: z.array(SubGallerySchema) }),
});

/** TypeScript type for thumbnail metadata */
export type Thumbnail = z.infer<typeof ThumbnailSchema>;

/** TypeScript type for media file metadata */
export type MediaFile = z.infer<typeof MediaFileSchema>;

/** TypeScript type for gallery section data */
export type GallerySection = z.infer<typeof GallerySectionSchema>;

/** TypeScript type for sub-gallery metadata */
export type SubGallery = z.infer<typeof SubGallerySchema>;

/** TypeScript type for gallery metadata */
export type GalleryMetadata = z.infer<typeof GalleryMetadataSchema>;

/** TypeScript type for complete gallery data structure */
export type GalleryData = z.infer<typeof GalleryDataSchema>;

/** Deprecated types */
export type MediaFileWithPath = z.infer<typeof MediaFileDeprecatedSchema>;
export type GallerySectionDeprecated = z.infer<typeof GallerySectionDeprecatedSchema>;
export type GalleryDataDeprecated = z.infer<typeof GalleryDataDeprecatedSchema>;

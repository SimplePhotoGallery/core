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

/**
 * Zod schema for media file with path.
 * @deprecated Use MediaFileSchema instead which uses 'filename' instead of 'path'.
 */
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

/**
 * Zod schema for a gallery section containing title, description, and media files.
 * @deprecated Use GallerySectionSchema instead which uses MediaFileSchema.
 */
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

/** Zod schema for portrait image size variants */
const PortraitSizesSchema = z.object({
  360: z.string().optional(),
  480: z.string().optional(),
  720: z.string().optional(),
  1080: z.string().optional(),
});

/** Zod schema for landscape image size variants */
const LandscapeSizesSchema = z.object({
  640: z.string().optional(),
  960: z.string().optional(),
  1280: z.string().optional(),
  1920: z.string().optional(),
  2560: z.string().optional(),
  3840: z.string().optional(),
});

/** Zod schema for header image variants allowing explicit specification of responsive hero images */
export const HeaderImageVariantsSchema = z.object({
  portrait: z
    .object({
      avif: PortraitSizesSchema.optional(),
      jpg: PortraitSizesSchema.optional(),
    })
    .optional(),
  landscape: z
    .object({
      avif: LandscapeSizesSchema.optional(),
      jpg: LandscapeSizesSchema.optional(),
    })
    .optional(),
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
  headerImageVariants: HeaderImageVariantsSchema.optional(),
  thumbnails: z
    .object({
      size: z.number().optional(),
      edge: z.enum(['auto', 'width', 'height']).optional(),
    })
    .optional(),
  metadata: GalleryMetadataSchema,
  mediaBaseUrl: z.string().optional(),
  thumbsBaseUrl: z.string().optional(),
  analyticsScript: z.string().optional(),
  ctaBanner: z.boolean().optional(),
  sections: z.array(GallerySectionSchema),
  subGalleries: z.object({ title: z.string(), galleries: z.array(SubGallerySchema) }),
});

/**
 * Zod schema for complete gallery data without mediaBasePath.
 * @deprecated Use GalleryDataSchema instead which includes mediaBasePath and headerImageVariants.
 */
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

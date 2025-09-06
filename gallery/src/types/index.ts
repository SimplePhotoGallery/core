import { z } from 'zod';

/**
 * Schema describing a generated thumbnail image.
 */
export const ThumbnailSchema = z.object({
  /** Path to the thumbnail file. */
  path: z.string(),
  /** Width of the thumbnail in pixels. */
  width: z.number(),
  /** Height of the thumbnail in pixels. */
  height: z.number(),
});

/**
 * Schema describing a media file within the gallery.
 */
export const MediaFileSchema = z.object({
  /** Type of the media file. */
  type: z.enum(['image', 'video']),
  /** Path to the media file. */
  path: z.string(),
  /** Optional alternative text. */
  alt: z.string().optional(),
  /** Width of the media file in pixels. */
  width: z.number(),
  /** Height of the media file in pixels. */
  height: z.number(),
  /** Optional thumbnail information. */
  thumbnail: ThumbnailSchema.optional(),
  /** Timestamp of the last processed media file. */
  lastMediaTimestamp: z.string().optional(),
});

/**
 * Schema for a gallery section grouping media files.
 */
export const GallerySectionSchema = z.object({
  /** Optional section title. */
  title: z.string().optional(),
  /** Optional section description. */
  description: z.string().optional(),
  /** Media files contained in the section. */
  images: z.array(MediaFileSchema),
});

/**
 * Schema describing a sub-gallery entry.
 */
export const SubGallerySchema = z.object({
  /** Title of the sub-gallery. */
  title: z.string(),
  /** Path to the header image. */
  headerImage: z.string(),
  /** Relative path to the sub-gallery. */
  path: z.string(),
});

/**
 * Schema for the entire gallery configuration.
 */
export const GalleryDataSchema = z.object({
  /** Title of the gallery. */
  title: z.string(),
  /** Description of the gallery. */
  description: z.string(),
  /** Header image path. */
  headerImage: z.string(),
  /** Size of thumbnails. */
  thumbnailSize: z.number(),
  /** Additional metadata. */
  metadata: z.object({
    ogUrl: z.string(),
  }),
  /** Optional output path for the built gallery. */
  galleryOutputPath: z.string().optional(),
  /** Optional base URL for media files. */
  mediaBaseUrl: z.string().optional(),
  /** Sections of the gallery. */
  sections: z.array(GallerySectionSchema),
  /** Sub-galleries information. */
  subGalleries: z.object({ title: z.string(), galleries: z.array(SubGallerySchema) }),
});

/**
 * Thumbnail type derived from {@link ThumbnailSchema}.
 */
export type Thumbnail = z.infer<typeof ThumbnailSchema>;
/**
 * Media file type derived from {@link MediaFileSchema}.
 */
export type MediaFile = z.infer<typeof MediaFileSchema>;
/**
 * Gallery section type derived from {@link GallerySectionSchema}.
 */
export type GallerySection = z.infer<typeof GallerySectionSchema>;
/**
 * Sub-gallery type derived from {@link SubGallerySchema}.
 */
export type SubGallery = z.infer<typeof SubGallerySchema>;
/**
 * Complete gallery data type derived from {@link GalleryDataSchema}.
 */
export type GalleryData = z.infer<typeof GalleryDataSchema>;

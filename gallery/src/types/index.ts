import { z } from 'zod';

/**
 * Zod schema for thumbnail metadata.
 * Defines the structure for thumbnail images including path and dimensions.
 */
export const ThumbnailSchema = z.object({
  path: z.string(),
  width: z.number(),
  height: z.number(),
});

/**
 * Zod schema for media file metadata.
 * Defines the structure for both image and video files with their properties.
 */
export const MediaFileSchema = z.object({
  type: z.enum(['image', 'video']),
  path: z.string(),
  alt: z.string().optional(),
  width: z.number(),
  height: z.number(),
  thumbnail: ThumbnailSchema.optional(),
  lastMediaTimestamp: z.string().optional(),
});

/**
 * Zod schema for gallery section metadata.
 * Defines a section within a gallery that contains a group of media files.
 */
export const GallerySectionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(MediaFileSchema),
});

/**
 * Zod schema for sub-gallery metadata.
 * Defines a nested gallery with its own title, header image, and path.
 */
export const SubGallerySchema = z.object({
  title: z.string(),
  headerImage: z.string(),
  path: z.string(),
});

/**
 * Zod schema for complete gallery data.
 * Defines the complete structure of a gallery configuration file.
 */
export const GalleryDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  headerImage: z.string(),
  thumbnailSize: z.number(),
  metadata: z.object({
    ogUrl: z.string(),
  }),
  galleryOutputPath: z.string().optional(),
  mediaBaseUrl: z.string().optional(),
  sections: z.array(GallerySectionSchema),
  subGalleries: z.object({ title: z.string(), galleries: z.array(SubGallerySchema) }),
});

/**
 * Type representing thumbnail metadata.
 * Contains path and dimensions of a thumbnail image.
 */
export type Thumbnail = z.infer<typeof ThumbnailSchema>;

/**
 * Type representing a media file (image or video).
 * Contains all metadata associated with a media file including dimensions and optional thumbnail.
 */
export type MediaFile = z.infer<typeof MediaFileSchema>;

/**
 * Type representing a gallery section.
 * A section groups related media files together with optional title and description.
 */
export type GallerySection = z.infer<typeof GallerySectionSchema>;

/**
 * Type representing a sub-gallery.
 * A nested gallery with its own configuration and media files.
 */
export type SubGallery = z.infer<typeof SubGallerySchema>;

/**
 * Type representing complete gallery data.
 * Contains all configuration and metadata for a photo gallery.
 */
export type GalleryData = z.infer<typeof GalleryDataSchema>;

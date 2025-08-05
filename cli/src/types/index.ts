import { z } from 'zod';

export const ThumbnailSchema = z.object({
  path: z.string(),
  width: z.number(),
  height: z.number(),
});

export const MediaFileSchema = z.object({
  type: z.enum(['image', 'video']),
  path: z.string(),
  alt: z.string().optional(),
  width: z.number(),
  height: z.number(),
  thumbnail: ThumbnailSchema.optional(),
});

export const GallerySectionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(MediaFileSchema),
});

export const SubGallerySchema = z.object({
  title: z.string(),
  headerImage: z.string(),
  path: z.string(),
});

export const GalleryDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  headerImage: z.string(),
  metadata: z.object({
    ogUrl: z.string(),
  }),
  galleryOutputPath: z.string().optional(),
  sections: z.array(GallerySectionSchema),
  subGalleries: z.object({ title: z.string(), galleries: z.array(SubGallerySchema) }),
});

export type Thumbnail = z.infer<typeof ThumbnailSchema>;
export type MediaFile = z.infer<typeof MediaFileSchema>;
export type GallerySection = z.infer<typeof GallerySectionSchema>;
export type SubGallery = z.infer<typeof SubGallerySchema>;
export type GalleryData = z.infer<typeof GalleryDataSchema>;

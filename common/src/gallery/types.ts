import type {
  GalleryDataDeprecatedSchema,
  GalleryDataSchema,
  GalleryMetadataSchema,
  GallerySectionDeprecatedSchema,
  GallerySectionSchema,
  HeaderImageVariantsSchema,
  MediaFileDeprecatedSchema,
  MediaFileSchema,
  SubGallerySchema,
  ThumbnailSchema,
} from './schemas';
import type { z } from 'zod';

/** TypeScript type for thumbnail metadata */
export type Thumbnail = z.infer<typeof ThumbnailSchema>;

/** TypeScript type for media file metadata */
export type MediaFile = z.infer<typeof MediaFileSchema>;

/** TypeScript type for gallery section data */
export type GallerySection = z.infer<typeof GallerySectionSchema>;

/** TypeScript type for sub-gallery metadata */
export type SubGallery = z.infer<typeof SubGallerySchema>;

/** TypeScript type for header image variants */
export type HeaderImageVariants = z.infer<typeof HeaderImageVariantsSchema>;

/** TypeScript type for gallery metadata */
export type GalleryMetadata = z.infer<typeof GalleryMetadataSchema>;

/** TypeScript type for complete gallery data structure */
export type GalleryData = z.infer<typeof GalleryDataSchema>;

/** Deprecated types */
export type MediaFileWithPath = z.infer<typeof MediaFileDeprecatedSchema>;
export type GallerySectionDeprecated = z.infer<typeof GallerySectionDeprecatedSchema>;
export type GalleryDataDeprecated = z.infer<typeof GalleryDataDeprecatedSchema>;

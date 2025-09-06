import { z } from 'zod';

/** Schema describing a generated thumbnail. */
export const ThumbnailSchema = z.object({
  /** Relative path to the thumbnail file. */
  path: z.string(),
  /** Width of the thumbnail in pixels. */
  width: z.number(),
  /** Height of the thumbnail in pixels. */
  height: z.number(),
});

/** Schema describing an image or video file in the gallery. */
export const MediaFileSchema = z.object({
  /** Type of media: image or video. */
  type: z.enum(['image', 'video']),
  /** Relative path to the media file. */
  path: z.string(),
  /** Optional alt text for the media. */
  alt: z.string().optional(),
  /** Width of the media in pixels. */
  width: z.number(),
  /** Height of the media in pixels. */
  height: z.number(),
  /** Optional thumbnail data. */
  thumbnail: ThumbnailSchema.optional(),
  /** Timestamp of the last processing of this media. */
  lastMediaTimestamp: z.string().optional(),
});

/** Schema describing a section within the gallery. */
export const GallerySectionSchema = z.object({
  /** Optional section title. */
  title: z.string().optional(),
  /** Optional section description. */
  description: z.string().optional(),
  /** Array of media files belonging to the section. */
  images: z.array(MediaFileSchema),
});

/** Schema describing a sub-gallery. */
export const SubGallerySchema = z.object({
  /** Title of the sub-gallery. */
  title: z.string(),
  /** Header image for the sub-gallery. */
  headerImage: z.string(),
  /** Relative path to the sub-gallery directory. */
  path: z.string(),
});

/** Root schema describing gallery metadata and structure. */
export const GalleryDataSchema = z.object({
  /** Title of the gallery. */
  title: z.string(),
  /** Description of the gallery. */
  description: z.string(),
  /** Header image for the gallery. */
  headerImage: z.string(),
  /** Default thumbnail size. */
  thumbnailSize: z.number(),
  /** Additional metadata. */
  metadata: z.object({
    /** Open Graph URL for sharing. */
    ogUrl: z.string(),
  }),
  /** Optional output path where the gallery should be built. */
  galleryOutputPath: z.string().optional(),
  /** Optional base URL for hosting media. */
  mediaBaseUrl: z.string().optional(),
  /** Sections containing the gallery's media. */
  sections: z.array(GallerySectionSchema),
  /** Sub-galleries grouped under this gallery. */
  subGalleries: z.object({ title: z.string(), galleries: z.array(SubGallerySchema) }),
});

/** Type representing a thumbnail. */
export type Thumbnail = z.infer<typeof ThumbnailSchema>;
/** Type representing a media file. */
export type MediaFile = z.infer<typeof MediaFileSchema>;
/** Type representing a gallery section. */
export type GallerySection = z.infer<typeof GallerySectionSchema>;
/** Type representing a sub-gallery. */
export type SubGallery = z.infer<typeof SubGallerySchema>;
/** Type representing the full gallery data structure. */
export type GalleryData = z.infer<typeof GalleryDataSchema>;

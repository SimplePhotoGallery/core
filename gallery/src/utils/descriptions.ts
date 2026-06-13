import { Buffer } from 'node:buffer';

import ExifReader from 'exifreader';

/**
 * Extracts description from image EXIF data
 * @param image - Image path, file contents as a Buffer, or File object
 * @returns Promise resolving to image description or undefined if not found
 */
export async function getImageDescription(image: string | Buffer | File): Promise<string | undefined> {
  try {
    // ExifReader.load returns Tags synchronously for a Buffer and a Promise for a path or File
    const tags = Buffer.isBuffer(image) ? ExifReader.load(image) : await ExifReader.load(image);

    // Description
    if (tags.description?.description) return tags.description.description;

    // ImageDescription
    if (tags.ImageDescription?.description) return tags.ImageDescription.description;

    // UserComment
    if (
      tags.UserComment &&
      typeof tags.UserComment === 'object' &&
      tags.UserComment !== null &&
      'description' in tags.UserComment
    ) {
      return (tags.UserComment as { description: string }).description;
    }

    // ExtDescrAccessibility
    if (tags.ExtDescrAccessibility?.description) return tags.ExtDescrAccessibility.description;

    // Caption/Abstract
    if (tags['Caption/Abstract']?.description) return tags['Caption/Abstract'].description;

    // XP Title
    if (tags.XPTitle?.description) return tags.XPTitle.description;

    // XP Comment
    if (tags.XPComment?.description) return tags.XPComment.description;
  } catch {
    return undefined;
  }
}

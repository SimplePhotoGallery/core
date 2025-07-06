declare module 'exif-reader' {
  export interface ExifData {
    image?: {
      ImageDescription?: string;
      [key: string]: any;
    };
    exif?: {
      [key: string]: any;
    };
    [key: string]: any;
  }

  export default function exifReader(buffer: Buffer): ExifData;
}
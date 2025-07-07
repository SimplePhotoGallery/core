export interface ScanOptions {
  path: string;
  output: string;
  recursive: boolean;
}

export interface MediaFile {
  type: 'image' | 'video';
  path: string;
  alt?: string;
  width: number;
  height: number;
  thumbnail?: {
    path: string;
    width: number;
    height: number;
  };
}

export interface ScanOptions {
  path: string;
  output: string;
  recursive: boolean;
}

export interface MediaFile {
  name: string;
  path: string;
  width: number;
  height: number;
  type: "image" | "video";
  description?: string;
}

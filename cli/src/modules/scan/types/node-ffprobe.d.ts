declare module "node-ffprobe" {
  export interface Stream {
    codec_type: string;
    width?: number;
    height?: number;
    [key: string]: any;
  }

  export interface ProbeResult {
    streams: Stream[];
    format: any;
  }

  export default function ffprobe(filePath: string): Promise<ProbeResult>;
}

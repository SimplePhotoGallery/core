/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'node-ffprobe' {
  /** Metadata for a single media stream. */
  export interface Stream {
    /** Codec type of the stream (e.g., video or audio). */
    codec_type: string;
    /** Width of the video stream in pixels. */
    width?: number;
    /** Height of the video stream in pixels. */
    height?: number;
    [key: string]: any;
  }

  /** Result returned by the ffprobe command. */
  export interface ProbeResult {
    /** Array of media streams. */
    streams: Stream[];
    /** Container format information. */
    format: any;
  }

  /**
   * Runs ffprobe on the given file path and returns metadata about the media file.
   *
   * @param filePath - Path to the media file
   * @returns Promise resolving to probe information
   */
  export default function ffprobe(filePath: string): Promise<ProbeResult>;
}

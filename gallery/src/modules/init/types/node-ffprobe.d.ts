/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'node-ffprobe' {
  /**
   * Video or audio stream information returned by ffprobe.
   */
  export interface Stream {
    /** Type of the stream, e.g. `video` or `audio`. */
    codec_type: string;
    /** Width of the video stream in pixels. */
    width?: number;
    /** Height of the video stream in pixels. */
    height?: number;
    /** Additional metadata provided by ffprobe. */
    [key: string]: any;
  }

  /**
   * Result returned by the ffprobe call.
   */
  export interface ProbeResult {
    /** All streams discovered in the file. */
    streams: Stream[];
    /** General file format information. */
    format: any;
  }

  /**
   * Inspect a media file using ffprobe.
   *
   * @param filePath - Path to the media file.
   * @returns Promise resolving with the ffprobe result.
   */
  export default function ffprobe(filePath: string): Promise<ProbeResult>;
}

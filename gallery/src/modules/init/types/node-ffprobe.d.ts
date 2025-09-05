/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'node-ffprobe' {
  /**
   * Represents a media stream from ffprobe output.
   * Contains codec and dimension information for video/audio streams.
   */
  export interface Stream {
    /** The type of codec (e.g., 'video', 'audio') */
    codec_type: string;
    /** Width of the video stream (if applicable) */
    width?: number;
    /** Height of the video stream (if applicable) */
    height?: number;
    /** Additional stream properties */
    [key: string]: any;
  }

  /**
   * Result object returned by ffprobe containing media file information.
   */
  export interface ProbeResult {
    /** Array of media streams found in the file */
    streams: Stream[];
    /** Format information about the media file */
    format: any;
  }

  /**
   * Default export function for probing media files with ffprobe.
   * @param filePath - Path to the media file to probe
   * @returns Promise resolving to probe results containing stream and format information
   */
  export default function ffprobe(filePath: string): Promise<ProbeResult>;
}

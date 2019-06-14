import { EventEmitter } from 'events';

declare namespace MjpegDecoder {
  interface MjpegDecoderOptions {
    /**
     * Specify the time interval in which the frames will be delivered.
     */
    interval: number;

    /**
     * Specify the max frames to consume before stopping.
     */
    maxFrames: number;

    /**
     * Specify the timeout before the http connection is aborted.
     */
    timeout: number;
  }

  type AbortReason = 'invalid_mjpeg_stream' | 'http_error' | 'stop' | 'max_buffer_size_exceeded' | 'end' | 'timeout';
}

declare class MjpegDecoder extends EventEmitter {
  constructor(url: string, options?: Partial<MjpegDecoder.MjpegDecoderOptions>);

  /**
   * Create an instance of MjpegDecoder used to take a onetime snapshot of the video stream.
   * @param {String} url the M-JPEG video stream source url
   * @param {Partial<MjpegDecoderOptions>} options decoder options
   */
  static decoderForSnapshot(url: string, options?: Partial<MjpegDecoder.MjpegDecoderOptions>): MjpegDecoder;

  /**
   * Start the M-JPEG decoder and begin consuming the M-JPEG video stream.
   * Listen for 'frame' event to get the decoded JPEG frames sequently.
   */
  start(): void;

  /**
   * Stop consuming the M-JPEG video stream.
   */
  stop(): void;

  /**
   * Take snapshot of the M-JPEG video stream.
   */
  takeSnapshot(): Promise<Buffer>;

  /**
   * Add listener for frame event which is emitted when a JPEG frame is decoded.
   */
  on(event: 'frame', listener: (frame: Buffer, seq: number) => void): this;

  /**
   * Add listener for abort event which is emitted for some reason.
   */
  on(event: 'abort', listener: (reason: MjpegDecoder.AbortReason, error?: Error) => void): this;
}

export = MjpegDecoder;

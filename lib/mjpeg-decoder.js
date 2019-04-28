const { EventEmitter } = require('events');
const liburl = require('url');
const http = require('http');
const https = require('https');

const BOUNDARY_PATTERN = /multipart\/x-mixed-replace;\s*boundary=(.*)/;

const SOI = Buffer.from([0xff, 0xd8]);
const EOI = Buffer.from([0xff, 0xd9]);
const EOF = -1;
const MAX_BUFFER_SIZE = 16 * 4096 * 4096;
const DEFAULT_INTERVAL = 0;
const DEFAULT_MAX_FRAMES = 0;
const DEFAULT_TIMEOUT = 10000;

const DEFAULT_OPTIONS = {
  interval: DEFAULT_INTERVAL,
  maxFrames: DEFAULT_MAX_FRAMES,
  timeout: DEFAULT_TIMEOUT
};

class MjpegDecoder extends EventEmitter {
  static decoderForSnapshot(url, options) {
    return new MjpegDecoder(
      url,
      Object.assign({}, options, { interval: 0, maxFrames: 1 })
      );
  }

  constructor(url, options) {
    super();
    this.url = url;
    this.frame = null;
    this.data = Buffer.alloc(0);
    this.imageStart = -1;
    this.imageEnd = -1;
    this.seq = 0;
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.lastFrameTime = null;
    this.callbackQueue = [];
  }

  start() {
    const urlOptions = liburl.parse(this.url);

    let timer = setTimeout(() => {
      clearTimeout(timer);
      timer = null;
      this.abort('timeout');
    }, this.options.timeout);

    this.req = (/^https:/.test(urlOptions.protocol) ? https : http).get(urlOptions, res => {
      clearTimeout(timer);
      timer = null;

      const contentType = res.headers['content-type'];
      if (!this.isValidMjpegStream(contentType)) {
        this.drainCallbackQueue(new Error('invalid mjpeg stream'));
        this.abort('invalid_mjpeg_stream');
        return;
      }

      res.on('data', this.onDataReceived.bind(this));

      res.on('error', err => {
        this.abort('http_error', err);
      });
    });

    this.req.on('error', err => {
      this.abort('http_error', err);
    });
  }

  stop() {
    if (!this.req) return;
    this.abort('end');
  }

  takeSnapshot() {
    return new Promise((resolve, reject) => {
      this.callbackQueue.push((err, frame) => {
        if (err) {
          reject(err);
        } else {
          resolve(frame);
        }
      });
      if (!this.req) {
        this.start();
      }
    });
  }

  onDataReceived(chunk) {
    this.data = Buffer.concat([this.data, chunk]);
    if (this.data.length >= MAX_BUFFER_SIZE) {
      this.drainCallbackQueue(
        new Error('max buffer size exceeded, which might be caused by an internal codec error')
        );
      this.abort('max_buffer_size_exceeded');
      return;
    }
    if (this.imageStart === EOF) {
      this.imageStart = this.data.indexOf(SOI);
    }

    if (this.imageStart >= 0) {
      if (this.imageEnd === EOF) {
        this.imageEnd = this.data.indexOf(EOI, this.imageStart + SOI.length);
      }
      if (this.imageEnd >= this.imageStart) {
        // a frame is found.
        const frame = this.data.slice(
          this.imageStart, this.imageEnd + EOI.length
          );
        try {
          this.onFrameReady(frame);
        } catch (e) {}
        this.data = this.data.slice(this.imageEnd + EOI.length);
        this.imageStart = EOF;
        this.imageEnd = EOF;
      }
    }
  }

  drainCallbackQueue(err, frame) {
    while (this.callbackQueue.length) {
      const callback = this.callbackQueue.shift();
      try {
        callback(err, frame);
      } catch (e) {}
    }
  }

  onFrameReady(frame) {
    const { interval, maxFrames } = this.options;
    if (this.lastFrameTime && (Date.now() - this.lastFrameTime) < interval) {
      this.drainCallbackQueue(null, frame);
      return;
    }

    this.lastFrameTime = Date.now();
    this.frame = frame;
    this.seq++;
    this.emit('frame', frame, this.seq);
    this.drainCallbackQueue(null, frame);

    if (maxFrames > 0 && this.seq >= maxFrames) {
      this.abort('end');
      return;
    }
  }

  abort(reason, error) {
    if (!this.req || this.req.aborted) return;
    try {
      this.req.abort();
    } catch (e) {}
    this.emit('abort', reason, error);
  }

  isValidMjpegStream(contentType) {
    const match = BOUNDARY_PATTERN.exec(contentType);
    return Boolean(match);
  }
}

module.exports = MjpegDecoder;
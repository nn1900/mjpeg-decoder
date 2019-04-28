# mjpeg-decoder
A NodeJS M-JPEG decoder which can be used to retrieve individual JPEG frames or take a snapshot from a IP/network camera which serves M-JPEG video stream.

## Installation
```
npm install mjpeg-decoder
```

or

```
yarn add mjpeg-decoder
```

## Usage

Typically, you use the `mjpeg-decoder` to read JPEG frames from an M-JPEG video stream.

```javascript
const fs = require('fs');
const MjpegDecoder = require('mjpeg-decoder');

// create a decoder which delivers a JPEG frame
// via the 'frame' event every 3 seconds.
const decoder = new MjpegDecoder(
  '<your stream url>', { interval: 3000 }
  );

decoder.on('frame', (frame, seq) => {
  fs.writeFileSync(`${seq}.jpg`, frame);
});

decoder.start();
```

But sometimes, you just want to take a snapshot of the M-JPEG video stream, and then forget. In this case, you can do like this:
```javascript
// create a decoder which takes a snapshot and forget
const decoder = new MjpegDecoder(
  '<your stream url>', { maxFrames: 1 }
  );
const frame = await decoder.takeSnapshot();
fs.writeFileSync('snapshot.jpg', frame);
```

Or, you can use the `MjpegDecoder.decoderForSnapshot` shorthand method to create the decoder instance:
```javascript
const decoder = MjpegDecoder.decoderForSnapshot('<your stream url>');
const frame = await decoder.takeSnapshot();
fs.writeFileSync('snapshot.jpg', frame);
```

## API

### Options
`MjpegDecoder.MjpegDecoderOptions`
- `interval`: Specify the time interval in which the frames will be delivered (_default: `0`_)
- `maxFrames`: Specify the max frames to consume before stopping (_default: `0`_)
- `timeout`: Specify the timeout before the http connection is aborted (_default: `10000`ms_)

### Constructor
```typescript
constructor(url: string, options?: Partial<MjpegDecoder.MjpegDecoderOptions>)
```

- `url`: url of the M-JPEG video stream source.
- `options`: control how the decoder will work as expected.

> How to find the url of the camera?
> The camera user manual should usually mention the URL, or searching the camera model number should get you a result as well. You can also try this tool http://skjm.com/icam/mjpeg.php or this tool https://www.ispyconnect.com/man.aspx.

### decoderForSnapshot
```typescript
static decoderForSnapshot(
  url: string,
  options?: Partial<MjpegDecoder.MjpegDecoderOptions>
): MjpegDecoder
```

Create an instance of MjpegDecoder used to take a onetime snapshot of the video stream.

- `url`: url of the M-JPEG video stream source.
- `options`: control how the decoder will work as expected.

### start
```typescript
start(): void
```

Start the M-JPEG decoder and begin consuming the M-JPEG video stream. Listen for 'frame' event to get the decoded JPEG frames sequently.

### stop
```typescript
stop(): void
```

Stop consuming the M-JPEG video stream.

### takeSnapshot
```typescript
takeSnapshot(): Promise<Buffer>
```

Take snapshot of the M-JPEG video stream.

## Events

### frame

```typescript
on(event: 'frame', listener: (frame: Buffer, seq: number) => void): this
```

Add listener for frame event which is emitted when a JPEG frame is decoded.
The event listener takes the decoded JPEG frame and sequence number as the parameters.


### abort

```typescript
on(event: 'abort', listener: (reason: MjpegDecoder.AbortReason, error?: Error) => void): this
```

Add listener for abort event which is emitted for some reason. The decoder will stop
consuming the video stream in the following cases:
- `timeout`: network timeout while connecting to the video stream source at the given url.
- `http_error`: when a network error or http error occured
- `invalid_mjpeg_stream`: if the source is not a valid M-JPEG video stream
- `end`: when you call the `stop` method of the decoder or the max frames have been delivered.
- `max_buffer_size_exceeded`: when the internal data buffer size reached the limit, and this might be caused by the M-JPEG decoding problem. If you accountered this error, please create an issue.

### Capture M-JPEG snapshot the other ways
Use wget:
```bash
$ wget <url> -O snapshot.jpg
```

Use ffmpeg:
```bash
ffmpeg -f MJPEG -y -i <url> -r 1 -vframes 1 -q:v 1 snapshot.jpg
```

## References
- https://aeroquartet.com/movierepair/jpeg.en.html
- https://www.media.mit.edu/pia/Research/deepview/exif.html
- https://github.com/jacksonliam/mjpg-streamer/
- https://channel9.msdn.com/coding4fun/articles/MJPEG-Decoder
- https://medium.com/@petehouston/capture-mjpg-streamer-snapshot-9d0e253b9bbd
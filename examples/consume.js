const fs = require('fs');
const MjpegDecoder = require('../lib/mjpeg-decoder');

const url = 'http://127.0.0.1:8000/?action=stream';

try {
  fs.mkdirSync('results');
} catch (e) {}

const decoder = new MjpegDecoder(url, { interval: 3000 });

decoder.on('frame', (frame, seq) => {
  fs.writeFileSync(`results/${seq}.jpg`, frame)
});

decoder.on('abort', (reason, err) => {
  console.log('decoder aborted for %s', reason, err);
});

decoder.start();
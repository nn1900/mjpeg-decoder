const fs = require('fs');
const MjpegDecoder = require('../lib/mjpeg-decoder');

const url = 'http://166.239.108.20:82/cgi-bin/faststream.jpg?stream=half&fps=15&rand=COUNTER';

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
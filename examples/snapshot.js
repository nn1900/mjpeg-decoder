/**
 * @file: snapshot.js
 * @author: eric <eric.blueplus@gmail.com>
 * @copyright: (c) 2015-2017 beego co., ltd
 */

const fs = require('fs');
const MjpegDecoder = require('../lib/mjpeg-decoder');

// const url = 'http://166.239.108.20:82/cgi-bin/faststream.jpg?stream=half&fps=15&rand=COUNTER';
const url = 'http://127.0.0.1:8000/?action=stream';

try {
  fs.mkdirSync('results');
} catch (e) {}

(async function() {
  const decoder = MjpegDecoder.decoderForSnapshot(url);

  decoder.on('abort', (reason, err) => {
    console.log('decoder aborted for %s', reason, err || '');
  });

  try {
    const frame = await decoder.takeSnapshot();
    fs.writeFileSync(`results/snapshot.jpg`, frame);
  } catch (e) {
    console.error(e);
  }
})();

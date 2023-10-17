const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const LimitSizeStream = require('./LimitSizeStream');

const server = new http.Server();

const endConnection = (response, statusCode, message) => {
  response.statusCode = statusCode;
  response.end(message);
};

const destroyStream = (streamArray) => {
  streamArray.forEach((stream) => stream.destroy());
};

const deleteFile = (fileStream, filepathArray) => {
  filepathArray.forEach((filepath) => {
    fileStream.unlink(filepath, (error) => {});
  });
};

server.on('request', (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':
      if (pathname.includes('/')) {
        endConnection(res, 400, "You can't request nested files");

        return;
      }

      const limitedStream = new LimitSizeStream({
        limit: 1000000,
        encoding: 'utf-8',
      });
      const writeStream = fs.createWriteStream(filepath, {
        flags: 'wx',
      });

      req.pipe(limitedStream).pipe(writeStream);

      writeStream.on('finish', () => {
        endConnection(res, 201, 'File was successfully uploaded');
      });

      limitedStream.on('error', (error) => {
        if (error.code === 'LIMIT_EXCEEDED') {
          endConnection(res, 413, 'File size exceeded');
        } else {
          endConnection(res, 500, 'Something went wrong');
        }

        destroyStream([writeStream]);
        deleteFile(fs, [filepath]);
      });

      writeStream.on('error', (error) => {
        if (error.code === 'EEXIST') {
          endConnection(res, 409, 'File already exists');

          return;
        }

        endConnection(res, 500, 'Something went wrong');
      });

      req.on('aborted', () => {
        destroyStream([writeStream, limitedStream]);
        deleteFile(fs, [filepath]);
      });

      break;

    default:
      endConnection(res, 501, 'Not implemented');
  }
});

module.exports = server;

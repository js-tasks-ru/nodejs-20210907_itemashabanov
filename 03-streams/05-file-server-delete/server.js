const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'DELETE':
      if (pathname.includes('/')) {
        res.statusCode = 400;
        res.end("You can't request nested files");

        return;
      }

      fs.unlink(filepath, (error) => {
        if (!error) {
          res.end('File deleted successfully');
        } else {
          if (error.code === 'ENOENT') {
            res.statusCode = 404;
            res.end('File is not found');
          } else {
            res.statusCode = 500;
            res.end('Something went wrong');
          }
        }
      });

      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8888;
const PUBLIC_DIR = path.join(__dirname);

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(PUBLIC_DIR, req.url);
  
  if (filePath === path.join(PUBLIC_DIR, '/')) {
    filePath = path.join(PUBLIC_DIR, 'static-login.html');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404</h1>', 'utf-8');
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

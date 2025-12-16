const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const FILE_PATH = '/shared/logs.txt';

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    try {
      const content = fs.readFileSync(FILE_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(content);
    } catch (error) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('File not found or empty yet. Waiting for writer...\n');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});


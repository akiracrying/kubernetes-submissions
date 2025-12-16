const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const COUNTER_FILE = '/shared/pingpong-counter.txt';

// Ensure directory exists
const dir = path.dirname(COUNTER_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Initialize counter file if it doesn't exist
if (!fs.existsSync(COUNTER_FILE)) {
  fs.writeFileSync(COUNTER_FILE, '0');
}

const server = http.createServer((req, res) => {
  if (req.url === '/pingpong' && req.method === 'GET') {
    try {
      let counter = parseInt(fs.readFileSync(COUNTER_FILE, 'utf8')) || 0;
      counter++;
      fs.writeFileSync(COUNTER_FILE, counter.toString());
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`pong ${counter}`);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading/writing counter');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});


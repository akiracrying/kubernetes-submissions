const http = require('http');

const PORT = process.env.PORT || 3000;
let counter = 0;

const server = http.createServer((req, res) => {
  if (req.url === '/pingpong' && req.method === 'GET') {
    counter++;
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`pong ${counter}`);
  } else if (req.url === '/pings' && req.method === 'GET') {
    // Endpoint for log-output app to get current count
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(counter.toString());
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});


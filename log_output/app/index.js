const http = require('http');
const { randomUUID } = require("crypto");

const PORT = process.env.PORT || 3000;
const id = randomUUID();

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    const status = {
      timestamp: new Date().toISOString(),
      randomString: id
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

setInterval(() => {
  console.log(`${new Date().toISOString()}: ${id}`);
}, 5000);

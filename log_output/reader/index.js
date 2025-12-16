const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const LOGS_FILE = '/shared/logs.txt';
const COUNTER_FILE = '/shared/pingpong-counter.txt';

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    try {
      let output = '';
      
      // Read logs file
      if (fs.existsSync(LOGS_FILE)) {
        const logs = fs.readFileSync(LOGS_FILE, 'utf8');
        // Get the last line (most recent log entry)
        const lines = logs.trim().split('\n');
        if (lines.length > 0) {
          output = lines[lines.length - 1];
        }
      }
      
      // Read ping-pong counter
      let pingPongCount = 0;
      if (fs.existsSync(COUNTER_FILE)) {
        try {
          pingPongCount = parseInt(fs.readFileSync(COUNTER_FILE, 'utf8')) || 0;
        } catch (error) {
          // Counter file might be empty or invalid
        }
      }
      
      // Format output: timestamp:randomString.\nPing / Pongs: X
      if (output) {
        output = output + '.\nPing / Pongs: ' + pingPongCount;
      } else {
        output = 'Ping / Pongs: ' + pingPongCount;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(output);
    } catch (error) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Error reading files. Waiting for data...\n');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});


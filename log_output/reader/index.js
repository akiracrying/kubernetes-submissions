const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const PING_PONG_SERVICE = process.env.PING_PONG_SERVICE || 'ping-pong';
const PING_PONG_PORT = process.env.PING_PONG_PORT || '3000';
const GREETER_SERVICE = process.env.GREETER_SERVICE || 'greeter-svc';
const GREETER_PORT = process.env.GREETER_PORT || '3000';
const MESSAGE = process.env.MESSAGE || '';
const LOGS_FILE = '/shared/logs.txt';
const INFORMATION_FILE = '/config/information.txt';

function getPingPongCount() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: PING_PONG_SERVICE,
      port: PING_PONG_PORT,
      path: '/pings',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const count = parseInt(data.trim()) || 0;
          resolve(count);
        } catch (error) {
          resolve(0);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error fetching ping-pong count:', error);
      resolve(0);
    });

    req.end();
  });
}

function getGreeting() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GREETER_SERVICE,
      port: GREETER_PORT,
      path: '/',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data.trim() || '');
      });
    });

    req.on('error', (error) => {
      console.error('Error fetching greeting:', error);
      resolve('');
    });

    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    try {
      let output = '';
      
      // Read file from ConfigMap
      let fileContent = '';
      if (fs.existsSync(INFORMATION_FILE)) {
        fileContent = fs.readFileSync(INFORMATION_FILE, 'utf8').trim();
      }
      
      // Read logs file
      let logLine = '';
      if (fs.existsSync(LOGS_FILE)) {
        const logs = fs.readFileSync(LOGS_FILE, 'utf8');
        // Get the last line (most recent log entry)
        const lines = logs.trim().split('\n');
        if (lines.length > 0) {
          logLine = lines[lines.length - 1];
        }
      }
      
      // Get ping-pong count via HTTP
      const pingPongCount = await getPingPongCount();
      
      // Get greeting from greeter service
      const greeting = await getGreeting();
      
      // Format output according to requirements:
      // file content: this text is from file
      // env variable: MESSAGE=hello world
      // timestamp:randomString.
      // Ping / Pongs: X
      // greetings: Hello from version 1 (or version 2)
      if (fileContent) {
        output += `file content: ${fileContent}\n`;
      }
      if (MESSAGE) {
        output += `env variable: MESSAGE=${MESSAGE}\n`;
      }
      if (logLine) {
        output += logLine + '.\n';
      }
      output += `Ping / Pongs: ${pingPongCount}\n`;
      if (greeting) {
        output += `greetings: ${greeting}`;
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


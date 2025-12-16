const http = require('http');

const PORT = process.env.PORT || 3000;
let todos = [
  { id: 1, text: 'Learn JavaScript' },
  { id: 2, text: 'Learn React' },
  { id: 3, text: 'Build a project' }
];
let nextId = 4;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle /api/todos endpoint (from Ingress) or /todos (direct access)
  const isTodosEndpoint = req.url === '/todos' || req.url.startsWith('/api/todos');
  
  if (isTodosEndpoint && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todos));
  } else if (isTodosEndpoint && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const text = data.text || '';
        
        // Validate: max 140 characters
        if (text.length > 140) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Todo cannot be longer than 140 characters' }));
          return;
        }
        
        if (text.trim().length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Todo cannot be empty' }));
          return;
        }
        
        const newTodo = {
          id: nextId++,
          text: text.trim()
        };
        todos.push(newTodo);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newTodo));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Todo backend server started in port ${PORT}`);
});


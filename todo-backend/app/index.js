const http = require('http');
const { Client } = require('pg');

const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'postgres-project';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'todos';

const dbConfig = {
  host: DB_HOST,
  port: parseInt(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
};

let dbClient = null;

async function initDatabase() {
  try {
    dbClient = new Client(dbConfig);
    await dbClient.connect();
    console.log('Connected to PostgreSQL');
    
    // Create table if it doesn't exist
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        text VARCHAR(140) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Initialize with default todos if table is empty
    const result = await dbClient.query('SELECT COUNT(*) FROM todos');
    if (parseInt(result.rows[0].count) === 0) {
      await dbClient.query(`
        INSERT INTO todos (text) VALUES 
        ('Learn JavaScript'),
        ('Learn React'),
        ('Build a project')
      `);
    }
    
    console.log('Database initialized');
  } catch (error) {
    console.error('Database connection error:', error);
    // Retry connection after delay
    setTimeout(initDatabase, 5000);
  }
}

async function getTodos() {
  try {
    if (!dbClient) {
      await initDatabase();
    }
    const result = await dbClient.query('SELECT id, text FROM todos ORDER BY id');
    return result.rows.map(row => ({
      id: row.id,
      text: row.text
    }));
  } catch (error) {
    console.error('Error getting todos:', error);
    return [];
  }
}

async function createTodo(text) {
  try {
    if (!dbClient) {
      await initDatabase();
    }
    const result = await dbClient.query(
      'INSERT INTO todos (text) VALUES ($1) RETURNING id, text',
      [text.trim()]
    );
    return {
      id: result.rows[0].id,
      text: result.rows[0].text
    };
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
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
    try {
      const todos = await getTodos();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(todos));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error fetching todos' }));
    }
  } else if (isTodosEndpoint && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
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
        
        const newTodo = await createTodo(text);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newTodo));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Initialize database on startup
initDatabase();

server.listen(PORT, () => {
  console.log(`Todo backend server started in port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (dbClient) {
    await dbClient.end();
  }
  process.exit(0);
});


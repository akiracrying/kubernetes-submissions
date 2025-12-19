const http = require('http');
const { Client } = require('pg');
const { connect, StringCodec } = require('nats');
const NATS = { connect, StringCodec };

const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'postgres-project';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'todos';
const NATS_URL = process.env.NATS_URL || 'nats://nats:4222';

const dbConfig = {
  host: DB_HOST,
  port: parseInt(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
};

let dbClient = null;
let natsConnection = null;

// Initialize NATS connection
async function initNATS() {
  try {
    const nc = await connect({
      servers: NATS_URL,
      reconnect: true,
      maxReconnectAttempts: -1,
      reconnectTimeWait: 2000
    });

    console.log('Connected to NATS');
    natsConnection = nc;

    (async () => {
      for await (const status of nc.status()) {
        if (status.type === 'reconnect') {
          console.log('Reconnected to NATS');
        }
      }
    })().catch(() => {
      // Ignore errors in status monitoring
    });

    return nc;
  } catch (error) {
    console.error('Error initializing NATS:', error);
    // Don't fail if NATS is not available
    return null;
  }
}

// Publish message to NATS
function publishToNATS(message) {
  if (natsConnection) {
    try {
      // Check if connection is closed
      if (natsConnection.isClosed()) {
        console.log('NATS connection is closed, skipping publish');
        return;
      }
      const sc = StringCodec();
      const payload = JSON.stringify({ message: message });
      natsConnection.publish('todos', sc.encode(payload));
      console.log('Published to NATS:', message);
    } catch (error) {
      console.error('Error publishing to NATS:', error);
      console.error('Error details:', error.message);
    }
  } else {
    console.log('NATS not connected, skipping publish');
  }
}

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
        done BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add done column if it doesn't exist (for existing databases)
    await dbClient.query(`
      ALTER TABLE todos 
      ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT FALSE
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
    const result = await dbClient.query('SELECT id, text, done FROM todos ORDER BY id');
    return result.rows.map(row => ({
      id: row.id,
      text: row.text,
      done: row.done || false
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
      'INSERT INTO todos (text) VALUES ($1) RETURNING id, text, done',
      [text.trim()]
    );
    return {
      id: result.rows[0].id,
      text: result.rows[0].text,
      done: result.rows[0].done || false
    };
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
}

async function updateTodo(id, data) {
  try {
    if (!dbClient) {
      await initDatabase();
    }
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (data.hasOwnProperty('done')) {
      updates.push(`done = $${paramIndex++}`);
      values.push(data.done);
    }
    
    if (data.hasOwnProperty('text')) {
      updates.push(`text = $${paramIndex++}`);
      values.push(data.text.trim());
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(id);
    const query = `UPDATE todos SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, text, done`;
    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Todo not found');
    }
    
    return {
      id: result.rows[0].id,
      text: result.rows[0].text,
      done: result.rows[0].done || false
    };
  } catch (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint for Ingress
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Handle /api/todos endpoint (from Ingress) or /todos (direct access)
  const isTodosEndpoint = req.url === '/todos' || req.url.startsWith('/api/todos');
  
  // Parse todo ID from URL (PUT /todos/:id or PUT /api/todos/:id)
  const todosIdMatch = req.url.match(/^\/(?:api\/)?todos\/(\d+)$/);
  const todoId = todosIdMatch ? parseInt(todosIdMatch[1]) : null;
  
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
        const timestamp = new Date().toISOString();
        
        // Log every todo request
        console.log(`[${timestamp}] POST /api/todos - Received todo: "${text}" (length: ${text.length})`);
        
        // Validate: max 140 characters
        if (text.length > 140) {
          const errorMsg = 'Todo cannot be longer than 140 characters';
          console.log(`[${timestamp}] POST /api/todos - REJECTED: ${errorMsg}`);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: errorMsg }));
          return;
        }
        
        if (text.trim().length === 0) {
          const errorMsg = 'Todo cannot be empty';
          console.log(`[${timestamp}] POST /api/todos - REJECTED: ${errorMsg}`);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: errorMsg }));
          return;
        }
        
        const newTodo = await createTodo(text);
        console.log(`[${timestamp}] POST /api/todos - ACCEPTED: Created todo with id ${newTodo.id}`);
        
        // Publish to NATS
        console.log(`[${timestamp}] Publishing to NATS: A todo was created`);
        publishToNATS('A todo was created');
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newTodo));
      } catch (error) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] POST /api/todos - ERROR: ${error.message || 'Invalid JSON'}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Invalid JSON' }));
      }
    });
  } else if (todoId && req.method === 'PUT') {
    // PUT /todos/:id or PUT /api/todos/:id
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] PUT /api/todos/${todoId} - Updating todo`);
        
        const updatedTodo = await updateTodo(todoId, data);
        console.log(`[${timestamp}] PUT /api/todos/${todoId} - SUCCESS: Updated todo`);
        
        // Publish to NATS if todo was marked as done
        if (data.done) {
          publishToNATS('A todo was updated');
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updatedTodo));
      } catch (error) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] PUT /api/todos/${todoId} - ERROR: ${error.message}`);
        
        if (error.message === 'Todo not found') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Todo not found' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message || 'Invalid JSON' }));
        }
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Initialize database and NATS on startup
initDatabase();
initNATS();

server.listen(PORT, () => {
  console.log(`Todo backend server started in port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (dbClient) {
    await dbClient.end();
  }
  if (natsConnection) {
    await natsConnection.close();
  }
  process.exit(0);
});


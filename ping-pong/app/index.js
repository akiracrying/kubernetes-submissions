const http = require('http');
const { Client } = require('pg');

const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'postgres';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'pingpong';

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
      CREATE TABLE IF NOT EXISTS counter (
        id SERIAL PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Initialize counter if table is empty
    const result = await dbClient.query('SELECT COUNT(*) FROM counter');
    if (parseInt(result.rows[0].count) === 0) {
      await dbClient.query('INSERT INTO counter (count) VALUES (0)');
    }
    
    console.log('Database initialized');
  } catch (error) {
    console.error('Database connection error:', error);
    // Retry connection after delay
    setTimeout(initDatabase, 5000);
  }
}

async function getCounter() {
  try {
    if (!dbClient) {
      await initDatabase();
    }
    const result = await dbClient.query('SELECT count FROM counter ORDER BY id DESC LIMIT 1');
    return result.rows[0] ? parseInt(result.rows[0].count) : 0;
  } catch (error) {
    console.error('Error getting counter:', error);
    return 0;
  }
}

async function incrementCounter() {
  try {
    if (!dbClient) {
      await initDatabase();
    }
    const result = await dbClient.query(`
      UPDATE counter 
      SET count = count + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = (SELECT id FROM counter ORDER BY id DESC LIMIT 1)
      RETURNING count
    `);
    return result.rows[0] ? parseInt(result.rows[0].count) : 0;
  } catch (error) {
    console.error('Error incrementing counter:', error);
    return 0;
  }
}

const server = http.createServer(async (req, res) => {
  // Main endpoint at root path
  if (req.url === '/' && req.method === 'GET') {
    const counter = await incrementCounter();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`pong ${counter}`);
  } else if (req.url === '/health' && req.method === 'GET') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else if (req.url === '/pings' && req.method === 'GET') {
    // Endpoint for log-output app to get current count
    const counter = await getCounter();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(counter.toString());
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Initialize database on startup
initDatabase();

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (dbClient) {
    await dbClient.end();
  }
  process.exit(0);
});


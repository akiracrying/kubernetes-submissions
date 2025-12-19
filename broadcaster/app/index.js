const http = require('http');
const https = require('https');
const { connect, StringCodec } = require('nats');
const NATS = { connect, StringCodec };

const PORT = process.env.PORT || 3000;
const NATS_URL = process.env.NATS_URL || 'nats://nats:4222';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const QUEUE_GROUP = 'broadcaster-queue';

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
    throw error;
  }
}

// Subscribe to NATS messages
function subscribeToNATS() {
  if (!natsConnection) {
    console.error('NATS connection not available');
    return;
  }

  // Use queue group to ensure messages are load-balanced across replicas
  // This prevents duplicate messages when multiple broadcaster instances are running
  const sc = StringCodec();
  const sub = natsConnection.subscribe('todos', { queue: QUEUE_GROUP });
  
  (async () => {
    for await (const msg of sub) {
      try {
        const data = JSON.parse(sc.decode(msg.data));
        console.log('Received NATS message:', data);
        
        // Send message to Telegram
        sendToTelegram(data.message || 'A todo was created/updated');
      } catch (error) {
        console.error('Error processing NATS message:', error);
      }
    }
  })().catch((error) => {
    console.error('Error in subscription loop:', error);
  });

  console.log(`Subscribed to NATS subject 'todos' with queue group '${QUEUE_GROUP}'`);
}

// Send message to Telegram
function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram credentials not configured');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: message
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk.toString();
    });
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('Message sent to Telegram successfully');
      } else {
        console.error('Error sending to Telegram:', res.statusCode, data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error sending to Telegram:', error);
  });

  req.write(payload);
  req.end();
}

// Health check server
const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    const health = {
      status: 'ok',
      nats_connected: natsConnection !== null && natsConnection.connected
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
  } else if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Broadcaster service is running');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Initialize and start server
async function start() {
  try {
    // Initialize NATS connection
    await initNATS();
    
    // Subscribe to NATS messages
    subscribeToNATS();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`Broadcaster service started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start broadcaster:', error);
    // Retry connection after delay
    setTimeout(start, 5000);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing NATS connection');
  if (natsConnection) {
    await natsConnection.close();
  }
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing NATS connection');
  if (natsConnection) {
    await natsConnection.close();
  }
  server.close(() => {
    process.exit(0);
  });
});

// Start the service
start();


# Broadcaster Service

Service that subscribes to NATS messages and broadcasts them to Telegram.

## How to Run

Node.js service that listens to NATS subject "todos" and sends formatted messages to a Telegram chat.

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NATS_URL`: NATS server URL (default: nats://nats:4222)
- `TELEGRAM_BOT_TOKEN`: Telegram bot token (required)
- `TELEGRAM_CHAT_ID`: Telegram chat ID (required)

### Endpoints

- `GET /`: Service status
- `GET /health`: Health check with NATS connection status

### Build

```bash
docker build -t broadcaster .
```

### Deploy

```bash
kubectl apply -f manifests/
```

Requires NATS server and Telegram bot credentials configured via Secret.


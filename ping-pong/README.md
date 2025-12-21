# Ping-Pong Application

Node.js application that increments a counter in PostgreSQL on each request.

## How to Run

The application responds with "pong {count}" where count is incremented on each GET request.

### Environment Variables

- `PORT`: Server port (default: 3000)
- `DB_HOST`: PostgreSQL host (default: postgres)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_USER`: Database user (default: postgres)
- `DB_PASSWORD`: Database password (default: postgres)
- `DB_NAME`: Database name (default: pingpong)

### Endpoints

- `GET /`: Returns "pong {count}"
- `GET /pings`: Returns current count
- `GET /health`: Health check endpoint

### Build

```bash
docker build -t ping-pong .
```

### Deploy

```bash
kubectl apply -f manifests/
```

Requires PostgreSQL database to be available.


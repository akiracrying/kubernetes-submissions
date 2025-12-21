# Todo Backend

REST API backend for managing TODO items with PostgreSQL storage and NATS messaging.

## How to Run

Node.js application providing CRUD operations for TODO items.

### Environment Variables

- `PORT`: Server port (default: 3000)
- `DB_HOST`: PostgreSQL host (default: postgres-project)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_USER`: Database user (default: postgres)
- `DB_PASSWORD`: Database password (default: postgres)
- `DB_NAME`: Database name (default: todos)
- `NATS_URL`: NATS server URL (default: nats://nats:4222)

### API Endpoints

- `GET /api/todos`: Get all todos
- `POST /api/todos`: Create a new todo (max 140 characters)
- `PUT /api/todos/:id`: Update a todo
- `GET /`: Health check

### Build

```bash
docker build -t todo-backend .
```

### Deploy

```bash
kubectl apply -f manifests/
```

Requires PostgreSQL database and NATS server to be available.


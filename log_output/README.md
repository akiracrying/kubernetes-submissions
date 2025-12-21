# Log Output Application

Simple Node.js application that generates log entries every 5 seconds.

## How to Run

The application consists of two containers:
- **Writer**: Writes logs to a shared volume
- **Reader**: Reads logs from the shared volume and displays them via HTTP

### Environment Variables

- `PORT`: Server port (default: 3000)

### Build

```bash
docker build -t log-output-writer -f writer/Dockerfile .
docker build -t log-output-reader -f reader/Dockerfile .
```

### Deploy

```bash
kubectl apply -k base/
```

The application is deployed to the `exercises` namespace and uses a PersistentVolume for log storage.


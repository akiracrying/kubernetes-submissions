# PostgreSQL

PostgreSQL StatefulSet configuration for persistent database storage.

## How to Run

PostgreSQL database deployed as a StatefulSet with persistent storage.

### Environment Variables

Configured via ConfigMap and Secret:
- Database credentials from Secret
- Configuration from ConfigMap

### Deploy

```bash
kubectl apply -f manifests/
```

Creates:
- StatefulSet with PostgreSQL container
- Service for database access
- PersistentVolumeClaim for data storage


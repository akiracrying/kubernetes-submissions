# Ping-Pong Serverless

Ping-pong application deployed as a Knative Service for serverless scaling.

## How to Run

Knative Service configuration for the ping-pong application with automatic scaling.

### Configuration

- Port: 8080 (Knative standard)
- Min replicas: 1 (to avoid cold starts with database)
- Max replicas: 10

### Deploy

```bash
kubectl apply -f knative-service.yaml
```

Requires:
- Knative Serving installed
- PostgreSQL database available
- Kourier ingress controller configured

### Access

The service is accessible via the Knative route URL:
```bash
kubectl get ksvc ping-pong
```


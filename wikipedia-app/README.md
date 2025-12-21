# Wikipedia App

Nginx-based application with init container and sidecar container.

## How to Run

The application consists of three containers:
- **Init container**: Downloads initial Wikipedia page (Kubernetes article)
- **Main container**: Nginx serving content from /usr/share/nginx/html
- **Sidecar container**: Periodically (5-15 minutes) downloads random Wikipedia pages

### Build

```bash
docker build -t wikipedia-init -f init/Dockerfile init/
docker build -t wikipedia-sidecar -f sidecar/Dockerfile sidecar/
```

### Deploy

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

All containers share a volume mounted at `/usr/share/nginx/html`. The init container runs first, then the main nginx and sidecar containers start together.


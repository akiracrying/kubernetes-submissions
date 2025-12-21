# DummySite Controller

Kubernetes controller that watches for DummySite custom resources and creates deployments to serve website content.

## How to Run

Node.js controller using @kubernetes/client-node to watch and reconcile DummySite resources.

### Custom Resource

The controller watches for `DummySite` resources with a `website_url` property. When created, it:
1. Fetches HTML content from the URL
2. Creates a ConfigMap with the HTML
3. Creates a Deployment with nginx serving the content
4. Creates a Service to expose the deployment

### Build

```bash
cd controller
docker build -t dummysite-controller .
```

### Deploy

```bash
kubectl apply -f crd.yaml
kubectl apply -f role.yaml
kubectl apply -f rolebinding.yaml
kubectl apply -f serviceaccount.yaml
kubectl apply -f deployment.yaml
```

### Example Usage

```bash
kubectl apply -f example-dummysite.yaml
```


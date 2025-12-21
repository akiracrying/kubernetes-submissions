# Log Output with Istio

Extended log-output application integrated with Istio service mesh and greeter service.

## How to Run

The application includes:
- **log-output**: Original log-output application with greeter integration
- **greeter**: Service with v1 and v2 versions for traffic splitting

### Traffic Splitting

The greeter service uses HTTPRoute for traffic splitting:
- 75% traffic to greeter v1
- 25% traffic to greeter v2

### Deploy

```bash
# Deploy greeter services
kubectl apply -k greeter/

# Deploy log-output (uses greeter service)
kubectl apply -k log_output/base/
```

Requires Gateway API CRDs and Istio service mesh to be installed.


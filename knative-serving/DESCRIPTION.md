# Exercise 5.6: Trying serverless

## Summary

Knative Serving was installed on a k3d cluster without Traefik. The cluster was created with port mapping `8081:80@loadbalancer` to enable access to Knative services.

Knative Serving components (CRDs, core, and Kourier ingress) were installed and configured with Magic DNS (sslip.io) for local development.

A test Knative service was deployed and verified to work with scale-to-zero functionality.


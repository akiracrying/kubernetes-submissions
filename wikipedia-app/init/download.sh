#!/bin/sh
set -e

# Create www directory if it doesn't exist
mkdir -p /www

# Download Kubernetes Wikipedia page
echo "Downloading Kubernetes Wikipedia page..."
curl -L -o /www/index.html https://en.wikipedia.org/wiki/Kubernetes

echo "Kubernetes Wikipedia page downloaded successfully"


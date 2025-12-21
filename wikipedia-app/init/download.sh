#!/bin/sh
set -e

# Create www directory if it doesn't exist (nginx uses /usr/share/nginx/html)
mkdir -p /usr/share/nginx/html

# Download Kubernetes Wikipedia page
echo "Downloading Kubernetes Wikipedia page..."
curl -L -o /usr/share/nginx/html/index.html https://en.wikipedia.org/wiki/Kubernetes

echo "Kubernetes Wikipedia page downloaded successfully"


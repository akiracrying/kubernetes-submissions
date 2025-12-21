# The Project

Main TODO list application with random Wikipedia page generation, image caching, and task management features.

## Overview

This is the core application of the project - a comprehensive TODO list management system. The application allows users to:
- Create and manage TODO items (up to 140 characters)
- Mark tasks as completed
- View random Wikipedia pages (generated via CronJob)
- View cached random images
- See real-time updates via NATS messaging integration

## Features

### TODO List Management
- Create new TODO items with text validation (max 140 characters)
- Mark items as done/not done
- View all todos with their status
- Real-time updates via NATS event streaming

### Wikipedia Integration
- Random Wikipedia pages are generated periodically via CronJob
- Wikipedia content is stored and accessible through the application

### Image Caching
- Fetches random images from external source (Picsum)
- Caches images locally to reduce external API calls
- Configurable cache duration (default: 10 minutes)

### Architecture
- Frontend web interface for TODO management
- Backend API integration with todo-backend service
- NATS messaging for real-time event broadcasting
- PostgreSQL database for persistent storage
- Image caching with PersistentVolume storage

## How to Run

Node.js application that serves a web interface and manages TODO items through backend API integration.

### Environment Variables

- `PORT`: Server port (default: 3000)
- `IMAGE_URL`: URL to fetch images from (default: https://picsum.photos/1200)
- `CACHE_DIR`: Directory for caching images (default: /cache)
- `CACHE_DURATION`: Cache duration in milliseconds (default: 600000)
- `TODO_BACKEND_URL`: URL for TODO backend API (default: /api/todos)

### Build

```bash
docker build -t the-project .
```

### Deploy

The application uses Kustomize for environment-specific configuration:

```bash
# Base configuration
kubectl apply -k base/

# Staging environment
kubectl apply -k overlays/staging/

# Production environment
kubectl apply -k overlays/production/
```

### Dependencies

The application requires several supporting services:
- **TODO Backend Service**: REST API for TODO CRUD operations
- **PostgreSQL**: Database for storing TODO items
- **NATS**: Message broker for real-time event streaming
- **Broadcaster Service**: Service for broadcasting TODO events (e.g., to Telegram)
- **PersistentVolume**: For image cache storage
- **Wikipedia Todo CronJob**: Generates random Wikipedia pages periodically

### Application Structure

- Main frontend web interface at root path
- Image caching service for random image display
- Integration with todo-backend API for data persistence
- NATS event consumption for real-time updates


#!/bin/bash
set -e

# Authenticate with service account
echo "Authenticating with service account..."
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS

# Create backup filename with date
BACKUP_FILE="backup-$(date +%Y-%m-%d-%H%M%S).sql"

# Perform pg_dump
echo "Creating database backup..."
PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
  -h $POSTGRES_HOST \
  -p $POSTGRES_PORT \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  > /tmp/$BACKUP_FILE

# Upload to GCS
echo "Uploading backup to GCS bucket: gs://$GCS_BUCKET/$BACKUP_FILE"
gsutil cp /tmp/$BACKUP_FILE gs://$GCS_BUCKET/$BACKUP_FILE

echo "Backup completed: $BACKUP_FILE"


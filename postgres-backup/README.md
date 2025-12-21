# PostgreSQL Backup

CronJob for automated PostgreSQL database backups.

## How to Run

CronJob that runs pg_dump to create database backups and stores them in a backup location.

### Configuration

The backup script is executed on a schedule defined in the CronJob manifest.

### Build

```bash
docker build -t postgres-backup .
```

### Deploy

```bash
kubectl apply -f cronjob.yaml
```

Requires PostgreSQL database to be accessible and backup storage configured.


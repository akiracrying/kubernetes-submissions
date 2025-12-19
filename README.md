# kubernetes-submissions
Submissions for k8s MOOC course 

## Exercises

### Chapter 1
- [1.1](../../tree/1.1/log_output)
- [1.2](../../tree/1.2/the-project)
- [1.3](../../tree/1.3/log_output)
- [1.4](../../tree/1.4/the-project)
- [1.5](../../tree/1.5/the-project)
- [1.6](../../tree/1.6/the-project)
- [1.7](../../tree/1.7/log_output)
- [1.8](../../tree/1.8/the-project)
- [1.9](../../tree/1.9/log_output)
- [1.10](../../tree/1.10/log_output)
- [1.11](../../tree/1.11/log_output)
- [1.12](../../tree/1.12/the-project)
- [1.13](../../tree/1.13/the-project)

### Chapter 2
- [2.1](../../tree/2.1/log_output)
- [2.2](../../tree/2.2/the-project)
- [2.3](../../tree/2.3/log_output)
- [2.4](../../tree/2.4/the-project)
- [2.5](../../tree/2.5/log_output)
- [2.6](../../tree/2.6/the-project)
- [2.7](../../tree/2.7/ping-pong)
- [2.8](../../tree/2.8/the-project)
- [2.9](../../tree/2.9/the-project)
- [2.10](../../tree/2.10/the-project)

### Chapter 3
- [3.1](../../tree/3.1/ping-pong)
- [3.2](../../tree/3.2/log_output)
- [3.3](../../tree/3.3/log_output)
- [3.4](../../tree/3.4/ping-pong)
- [3.5](../../tree/3.5/the-project)
- [3.6](../../tree/3.6/the-project)
- [3.7](../../tree/3.7/the-project)
- [3.8](../../tree/3.8/the-project)
- [3.9](../../tree/3.9/the-project)
- [3.10](../../tree/3.10/the-project)
- [3.11](../../tree/3.11/the-project)
- [3.12](../../tree/3.12/screenshots)

### Chapter 4
- [4.1](../../tree/4.1/ping-pong)
- [4.2](../../tree/4.2/the-project)
- [4.3](../../tree/4.3/screenshots)
- [4.4](../../tree/4.4/ping-pong)
- [4.5](../../tree/4.5/the-project)
- [4.6](../../tree/4.6/the-project)

## Exercise 3.9: DBaaS vs DIY - Pros/Cons Comparison

### Database as a Service (DBaaS) - Google Cloud SQL

**Pros:**
- **Initial Setup:** Minimal configuration required - just create an instance through GCP console or gcloud CLI. No need to manage Docker images, StatefulSets, or PersistentVolumes.
- **Maintenance:** Fully managed service - Google handles patching, updates, backups, and monitoring. No need for database administration expertise.
- **Backups:** Automated daily backups included by default. Point-in-time recovery available. Easy to configure backup retention policies through GCP console.
- **High Availability:** Built-in replication and failover options. Multi-zone deployment available for production workloads.
- **Security:** Managed encryption at rest and in transit. Integrated with IAM for access control. Regular security updates handled automatically.
- **Monitoring:** Integrated with Cloud Monitoring and Cloud Logging. Built-in performance insights and query analytics.
- **Scaling:** Easy vertical scaling (change instance size) and horizontal scaling with read replicas. Minimal downtime for scaling operations.

**Cons:**
- **Cost:** Higher ongoing costs - pay for instance size and storage regardless of actual usage. Network egress costs may apply.
- **Vendor Lock-in:** Tied to Google Cloud Platform. Migration to other clouds or self-managed solutions requires data export/import.
- **Less Control:** Limited customization options. Cannot modify PostgreSQL configuration as freely as self-managed instances.
- **Network Latency:** External service - may have slightly higher latency compared to database in the same cluster.
- **Initial Cost:** Even for small projects, minimum instance size may be more expensive than necessary.

### DIY - Self-Managed PostgreSQL with PersistentVolumes

**Pros:**
- **Initial Setup Cost:** Very low - only pay for the storage and compute resources you actually use. Can start with minimal resources.
- **Flexibility:** Full control over PostgreSQL configuration, versions, and extensions. Can customize to specific application needs.
- **No Vendor Lock-in:** Standard PostgreSQL - can migrate anywhere. Docker images and StatefulSet configs are portable.
- **Network Performance:** Database runs in the same cluster as applications - potentially lower latency for in-cluster communication.
- **Resource Efficiency:** Can allocate exactly the resources needed. Good for development and small-scale applications.

**Cons:**
- **Initial Setup Work:** Requires creating StatefulSet, PersistentVolumeClaims, Services, ConfigMaps, Secrets. Must configure PostgreSQL container properly.
- **Maintenance Burden:** Responsible for PostgreSQL updates, patches, security fixes. Need to monitor database health, performance, and resource usage.
- **Backup Complexity:** Must implement backup strategy manually (pg_dump, WAL archiving, etc.). Need to configure automated backup jobs (CronJobs or external tools). Storage and management of backups is your responsibility.
- **High Availability:** Requires manual setup of replication, failover mechanisms. More complex to achieve multi-zone redundancy.
- **Monitoring:** Need to set up monitoring tools (Prometheus, custom exporters). Must configure alerting for database issues.
- **Expertise Required:** Requires PostgreSQL administration knowledge. Troubleshooting database issues falls on the team.
- **Scaling Complexity:** Manual process - need to update StatefulSet, handle data migration, plan for downtime during scaling operations.
- **Data Persistence Risk:** If PersistentVolume fails or is misconfigured, data loss is possible. Must carefully manage PVC lifecycle.

### Summary

**Choose DBaaS (Cloud SQL) when:**
- Production workloads with uptime requirements
- Team lacks PostgreSQL expertise
- Budget allows for managed service
- Compliance and security are critical
- Need automated backups and monitoring

**Choose DIY (PersistentVolumes) when:**
- Development or small-scale applications
- Cost optimization is important
- Need full control and customization
- Team has PostgreSQL expertise
- Want to avoid vendor lock-in

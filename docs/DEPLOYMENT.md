# Deployment Guide

## Overview

This document covers deployment strategies for the Real Estate Investment ROI App, including Docker containerization and fly.io deployment.

## 🚨 Critical Database Volume Synchronization Issue (September 30, 2025)

### Problem: Multiple Volumes Causing Login Failures

**Symptom**: Production application returns "Login failed. Invalid `prisma.user.findUnique()` invocation: The table `main.users` does not exist in the current database."

**Root Cause**: Multiple Fly.io volumes with identical names (`database_vol`) attached to different machines. Database seeding occurs on one volume while the active machine uses an empty volume.

### Solution: Volume Identification and Database Synchronization

1. **Identify Volume Mapping**:
   ```bash
   fly volumes list
   fly machines list
   ```

2. **Locate Active Machine**:
   ```bash
   fly status
   ```

3. **SSH to Active Machine and Synchronize Database**:
   ```bash
   fly ssh console --command "npx prisma migrate deploy"
   fly ssh console --command "npx prisma db seed"
   ```

4. **Verify Database Contents**:
   ```bash
   fly ssh console --command "ls -la /data/"
   ```

5. **Clean Up Unused Resources**:
   ```bash
   fly machines remove [unused-machine-id] --force
   fly volumes destroy [unused-volume-id] --yes
   ```

### Prevention

- Always verify volume attachment before seeding
- Use unique volume names for different deployments
- Monitor machine-volume mapping during deployment

## Database Migration Issues (P3005 Error)

### Problem

The `P3005: The database schema is not empty` error occurs when deploying to existing databases that have schema but are not tracked by Prisma migrations.

### Solution

We've implemented a comprehensive deployment strategy that handles multiple scenarios:

1. **Fresh Database**: Standard migration deployment
2. **Existing Schema**: Database baseline resolution
3. **Failed Migrations**: Force reset with data preservation warnings
4. **Volume Synchronization**: Database consistency across multiple machines

## Deployment Scripts

### 1. Main Deployment Script (`scripts/deploy-db.sh`)

```bash
bash scripts/deploy-db.sh
```

This script handles:
- Database existence checking
- Migration deployment with error handling
- Automatic baseline resolution for P3005 errors
- Force reset option for critical failures
- Seed data deployment

### 2. Baseline Script (`scripts/baseline-db.sh`)

```bash
bash scripts/baseline-db.sh
```

Use this for existing databases that need to be brought under Prisma migration control.

### 3. PowerShell Versions

- `scripts/deploy-db.ps1`
- `scripts/baseline-db.ps1`

## fly.io Deployment

### Configuration (`fly.toml`)

```toml
[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  DATABASE_URL = "file:/data/production.db"
  NEXTAUTH_URL = "https://real-estate-investment-roi-app.fly.dev"

[experimental]
  cmd = ["npm", "start"]

[[mounts]]
  source = "data"
  destination = "/data"

[deploy]
  release_command = "bash scripts/deploy-db.sh"
```

### Key Points:

- Database stored on persistent volume at `/data/production.db`
- Release command runs our comprehensive deployment script
- Environment variables properly configured for production

## Docker Configuration

### Multi-Platform Support

The Dockerfile includes Prisma binary targets for different architectures:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x", "linux-musl-arm64-openssl-3.0.x"]
}
```

### OpenSSL Compatibility

OpenSSL 3.0.x is explicitly installed in all Docker stages to resolve Prisma compatibility issues.

## Testing

### Local Testing

```bash
npm test
```

### Database Migration Testing

```bash
npm run test:deployment
```

### Coverage

- 27 test suites
- 172 passing tests
- Coverage reports available in `docs/coverage/`

## Troubleshooting

### Volume Synchronization Issues

**Symptom**: "The table `main.users` does not exist in the current database"

**Steps to Resolve**:

1. **Check Machine Status**:
   ```bash
   fly status
   fly machines list
   fly volumes list
   ```

2. **Identify Active Machine and Volume**:
   - Look for machine with `started` state
   - Verify which volume is attached to active machine
   - Check if volume is correctly seeded

3. **SSH and Fix Database**:
   ```bash
   fly ssh console --command "ls -la /data/"
   fly ssh console --command "npx prisma migrate deploy"
   fly ssh console --command "npx prisma db seed"
   ```

4. **Verify Fix**:
   ```bash
   fly ssh console --command "ls -la /data/"
   # Should show production.db with size > 0
   ```

5. **Test Application**:
   - Visit application URL
   - Test login with admin credentials
   - Verify database connectivity

### P3005 Error Resolution Steps

1. **Automatic**: The deployment script handles this automatically
2. **Manual**: Run `bash scripts/baseline-db.sh` then retry deployment
3. **Force Reset**: Only if data loss is acceptable

### Common Issues

1. **Database Path**: Ensure `DATABASE_URL` points to volume-mounted location
2. **Permissions**: Deployment scripts must be executable in Docker
3. **Environment Variables**: Verify production URLs are correct
4. **Multiple Volumes**: Check for duplicate volume names causing conflicts
5. **Machine-Volume Mismatch**: Verify active machine uses correct volume

## Deployment Checklist

- [ ] Database migrations tested locally
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Volume mounting configured
- [ ] Deployment scripts executable
- [ ] Backup strategy in place (if applicable)

## Migration Strategy Details

### Strategy 1: Standard Deployment

```bash
npx prisma migrate deploy
```
Used for fresh databases or properly tracked existing databases.

### Strategy 2: Baseline Resolution

```bash
npx prisma migrate resolve --applied [migration]
npx prisma migrate deploy
```
Used when existing schema needs to be brought under migration control.

### Strategy 3: Force Reset

```bash
npx prisma migrate reset --force --skip-seed
npx prisma db push
npx prisma db seed
```
Used only when other strategies fail and data loss is acceptable.

## Security Considerations

- Database stored on encrypted persistent volumes
- Environment variables properly scoped
- Production URLs configured
- Authentication properly configured

## Performance Notes

- SQLite database optimized for read-heavy workloads
- Connection pooling configured
- Static assets properly cached
- Docker image layers optimized

## Monitoring

- Application logs available via `fly logs`
- Database performance can be monitored via admin panel
- Error tracking through Next.js error boundaries

## Backup Strategy

For production deployments:
1. Regular volume snapshots via fly.io
2. Database export scripts available
3. Schema versioning through Prisma migrations
4. Code versioning through Git

## Success Criteria

✅ **All deployment issues resolved as of September 30, 2025**

- Application accessible at https://real-estate-roi-app.fly.dev
- Login functionality working with admin credentials
- Database properly seeded with sample data
- All 29 test suites (180 tests) passing
- Single clean machine deployment with synchronized volume

---

*Last updated: September 30, 2025*
*Version: 2.0.0 - Volume Synchronization Fix*
# Deployment Guide

## Overview

This document covers deployment strategies for the Real Estate Investment ROI App, including Docker containerization and fly.io deployment.

## Database Migration Issues (P3005 Error)

### Problem

The `P3005: The database schema is not empty` error occurs when deploying to existing databases that have schema but are not tracked by Prisma migrations.

### Solution

We've implemented a comprehensive deployment strategy that handles multiple scenarios:

1. **Fresh Database**: Standard migration deployment
2. **Existing Schema**: Database baseline resolution
3. **Failed Migrations**: Force reset with data preservation warnings

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

### P3005 Error Resolution Steps:

1. **Automatic**: The deployment script handles this automatically
2. **Manual**: Run `bash scripts/baseline-db.sh` then retry deployment
3. **Force Reset**: Only if data loss is acceptable

### Common Issues:

1. **Database Path**: Ensure `DATABASE_URL` points to volume-mounted location
2. **Permissions**: Deployment scripts must be executable in Docker
3. **Environment Variables**: Verify production URLs are correct

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

---

*Last updated: January 2025*
*Version: 1.0.0*
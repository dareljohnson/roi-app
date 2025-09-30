#!/bin/bash
set -e

echo "🚀 Starting deployment process..."

# Optional controls (can be set via Fly env vars or at deploy time):
#   DEPLOY_RUN_MIGRATIONS=true|false (default: true)
#   DEPLOY_RUN_SEED=true|false       (default: true)
# Accept also 1/0 values.

RUN_MIGRATIONS=${DEPLOY_RUN_MIGRATIONS:-true}
RUN_SEED=${DEPLOY_RUN_SEED:-true}

should_run() {
  # Normalize value to lowercase
  v="$(echo "$1" | tr '[:upper:]' '[:lower:]')"
  if [ "$v" = "false" ] || [ "$v" = "0" ] || [ -z "$v" ]; then
    return 1
  fi
  return 0
}

# Ensure /data exists and is writable (Fly volume mount). Prisma needs to create/modify production.db here.
if [ -d /data ]; then
  DATA_OWNER_UID=$(stat -c %u /data || echo 0)
  if [ "$DATA_OWNER_UID" != "1001" ]; then
    echo "🛠  Ensuring /data owned by nextjs (1001:1001) for Prisma operations"
    chown -R 1001:1001 /data || echo "⚠️  Could not chown /data (continuing)"
  fi
  chmod 775 /data || true
else
  echo "⚠️  /data directory not found. This may mean the volume isn't mounted. Continuing, but migrations may fail."
fi

# --- Always ensure schema is present before seeding ---
if should_run "$RUN_MIGRATIONS"; then
  echo "📁 Ensuring database schema is up to date (migrations enabled)..."
  if npx prisma migrate deploy; then
    echo "✅ Migrations deployed successfully"
  else
    echo "⚠️  Migration failed, attempting to baseline and push schema..."
    if npx prisma migrate resolve --applied "$(ls prisma/migrations | head -1)" 2>/dev/null; then
      echo "🔧 Database baselined, retrying migration deploy..."
      if ! npx prisma migrate deploy; then
        echo "❌ Migration failed after baseline. Exiting."
        exit 1
      fi
    else
      echo "🔄 Running database push to sync schema..."
      if ! npx prisma db push --force-reset; then
        echo "❌ prisma db push failed. Exiting."
        exit 1
      fi
    fi
  fi
else
  echo "⏭  Skipping migrations because DEPLOY_RUN_MIGRATIONS=$RUN_MIGRATIONS"
  if [ ! -f /data/production.db ]; then
    echo "⚠️  Warning: Skipping migrations but no existing /data/production.db found. Application may fail if schema missing."
  fi
fi

if should_run "$RUN_SEED"; then
  echo "🌱 Running database seed (seeding enabled)..."
  if npx prisma db seed; then
    echo "✅ Database seeding completed successfully"
  else
    echo "❌ Database seeding failed! (non-fatal)"
    # Don't exit here as the app can still run without seed data
  fi
else
  echo "⏭  Skipping seed because DEPLOY_RUN_SEED=$RUN_SEED"
fi

echo "✅ Deployment process completed successfully"
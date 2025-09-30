#!/bin/bash
set -e

echo "🚀 Starting deployment process..."

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
echo "📁 Ensuring database schema is up to date..."
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

echo "🌱 Running database seed..."
if ! npx prisma db seed; then
  echo "⚠️  Seed failed or no seed data"
fi

echo "✅ Deployment process completed successfully"
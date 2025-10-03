#!/bin/bash
set -euo pipefail

echo "🔐 Entrypoint starting as user: $(id -u):$(id -g) ($(id -un))"

# If /data is mounted ensure correct ownership (needed when running as root during release phase)
if [ -d /data ]; then
  # Only chown if not already owned by nextjs (1001)
  DATA_OWNER_UID=$(stat -c %u /data || echo 0)
  if [ "$DATA_OWNER_UID" != "1001" ]; then
    echo "🛠  Adjusting /data ownership to nextjs (1001:1001)"
    chown -R 1001:1001 /data || echo "⚠️  Could not chown /data (may already be correct)"
  fi
  chmod 775 /data || true
fi

# Ensure public upload directories exist and are writable by nextjs before dropping privileges
UPLOAD_BASE="/app/public/uploads"
PHOTO_DIR="$UPLOAD_BASE/walkthrough-photos"
if [ ! -d "$PHOTO_DIR" ]; then
  echo "📁 Creating upload directories: $PHOTO_DIR"
  mkdir -p "$PHOTO_DIR" || echo "⚠️  Failed to create $PHOTO_DIR"
fi

# Adjust ownership only if not already owned by nextjs
if [ -d "$UPLOAD_BASE" ]; then
  UP_OWNER=$(stat -c %u "$UPLOAD_BASE" || echo 0)
  if [ "$UP_OWNER" != "1001" ]; then
    echo "🛠  Adjusting ownership of $UPLOAD_BASE to nextjs (1001:1001)"
    chown -R 1001:1001 "$UPLOAD_BASE" || echo "⚠️  Could not chown $UPLOAD_BASE"
  fi
  chmod -R 775 "$UPLOAD_BASE" || true
fi

# Release command path: fly runs `./docker-entrypoint.sh bash scripts/deploy-db.sh`
if [ "${1:-}" = "bash" ] && [ "${2:-}" = "scripts/deploy-db.sh" ]; then
  echo "🚀 Running release command: bash scripts/deploy-db.sh"
  exec bash scripts/deploy-db.sh
fi

# For normal app runtime, drop privileges to nextjs if currently root
if [ "$(id -u)" = "0" ]; then
  echo "🔽 Dropping privileges to nextjs user"
  if command -v su-exec >/dev/null 2>&1; then
    exec su-exec nextjs:nextjs node server.js
  elif command -v gosu >/dev/null 2>&1; then
    exec gosu nextjs:nextjs node server.js
  else
    echo "⚠️  su-exec/gosu not found, running as root (consider installing su-exec)." >&2
    exec node server.js
  fi
else
  echo "🌐 Starting Node.js server as non-root user"
  exec node server.js
fi
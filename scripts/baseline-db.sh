#!/bin/bash
# Script to baseline an existing production database
# This resolves the P3005 error when deploying to existing databases

set -e

echo "🔧 Baselining existing production database..."

# Get list of migrations
MIGRATIONS_DIR="prisma/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ No migrations directory found"
    exit 1
fi

# Get all migration folders
MIGRATIONS=$(ls "$MIGRATIONS_DIR" | grep -E '^[0-9]+_' | sort)

if [ -z "$MIGRATIONS" ]; then
    echo "❌ No migrations found"
    exit 1
fi

# Mark all existing migrations as applied
for migration in $MIGRATIONS; do
    echo "📝 Marking migration as applied: $migration"
    npx prisma migrate resolve --applied "$migration" || echo "⚠️  Could not mark $migration as applied (might already be applied)"
done

echo "✅ Database baseline completed successfully"
echo "💡 You can now run 'npx prisma migrate deploy' safely"
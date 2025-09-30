# PowerShell version of database baseline script
# This resolves the P3005 error when deploying to existing databases

$ErrorActionPreference = "Stop"

Write-Host "🔧 Baselining existing production database..." -ForegroundColor Blue

# Get list of migrations
$migrationsDir = "prisma/migrations"

if (-not (Test-Path $migrationsDir)) {
    Write-Host "❌ No migrations directory found" -ForegroundColor Red
    exit 1
}

# Get all migration folders
$migrations = Get-ChildItem $migrationsDir -Directory | Where-Object { $_.Name -match '^[0-9]+_' } | Sort-Object Name

if ($migrations.Count -eq 0) {
    Write-Host "❌ No migrations found" -ForegroundColor Red
    exit 1
}

# Mark all existing migrations as applied
foreach ($migration in $migrations) {
    Write-Host "📝 Marking migration as applied: $($migration.Name)" -ForegroundColor Yellow
    try {
        npx prisma migrate resolve --applied $migration.Name
    } catch {
        Write-Host "⚠️  Could not mark $($migration.Name) as applied (might already be applied)" -ForegroundColor Yellow
    }
}

Write-Host "✅ Database baseline completed successfully" -ForegroundColor Green
Write-Host "💡 You can now run 'npx prisma migrate deploy' safely" -ForegroundColor Cyan
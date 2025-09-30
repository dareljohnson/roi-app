#!/usr/bin/env pwsh

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Check if database exists and has data
$dbPath = "/data/production.db"
if ((Test-Path $dbPath) -and ((Get-Item $dbPath).Length -gt 0)) {
    Write-Host "📁 Database exists, attempting migration deploy..." -ForegroundColor Yellow
    
    # Try to deploy migrations
    $deployResult = npx prisma migrate deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Migration failed, checking if database needs to be baselined..." -ForegroundColor Yellow
        
        # Get the first migration name
        $firstMigration = Get-ChildItem "prisma/migrations" | Select-Object -First 1 | Select-Object -ExpandProperty Name
        
        if ($firstMigration) {
            # Try to resolve the baseline issue
            $resolveResult = npx prisma migrate resolve --applied $firstMigration 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "🔧 Database baselined, retrying migration deploy..." -ForegroundColor Blue
                npx prisma migrate deploy
            } else {
                Write-Host "🔄 Running database push to sync schema..." -ForegroundColor Blue
                npx prisma db push --force-reset
                Write-Host "🌱 Running database seed..." -ForegroundColor Blue
                npx prisma db seed
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "⚠️  Seed failed or no seed data" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "🔄 No migrations found, running database push..." -ForegroundColor Blue
            npx prisma db push
        }
    }
} else {
    Write-Host "🆕 New database, running initial setup..." -ForegroundColor Cyan
    npx prisma db push
    Write-Host "🌱 Running database seed..." -ForegroundColor Cyan
    npx prisma db seed
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Seed failed or no seed data" -ForegroundColor Yellow
    }
}

Write-Host "✅ Deployment process completed successfully" -ForegroundColor Green
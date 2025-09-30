# Real Estate ROI App Deployment Script for fly.io (PowerShell)

Write-Host "🏠 Deploying Real Estate Investment ROI Calculator to fly.io..." -ForegroundColor Green

# Check if flyctl is installed
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ flyctl is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    flyctl auth whoami | Out-Null
} catch {
    Write-Host "🔐 Please log in to fly.io first:" -ForegroundColor Yellow
    Write-Host "   flyctl auth login" -ForegroundColor Cyan
    exit 1
}

# Create volume for database (if it doesn't exist)
Write-Host "📦 Creating database volume..." -ForegroundColor Blue
try {
    flyctl volumes create database_vol --region ord --size 1
} catch {
    Write-Host "Volume may already exist" -ForegroundColor Yellow
}

# Deploy the application
Write-Host "🚀 Deploying application..." -ForegroundColor Blue
flyctl deploy

# Show status
Write-Host "📊 Checking deployment status..." -ForegroundColor Blue
flyctl status

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your application should be available at: https://real-estate-roi-app.fly.dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Yellow
Write-Host "   flyctl logs                    - View application logs" -ForegroundColor Gray
Write-Host "   flyctl ssh console            - SSH into the application" -ForegroundColor Gray
Write-Host "   flyctl status                 - Check application status" -ForegroundColor Gray
Write-Host "   flyctl volumes list           - List volumes" -ForegroundColor Gray
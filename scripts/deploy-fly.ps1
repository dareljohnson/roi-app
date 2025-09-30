# PowerShell deployment script for Fly.io
# Usage: .\deploy-fly.ps1 [-BuildOnly]

param(
    [switch]$BuildOnly
)

$ErrorActionPreference = 'Stop'

# Check for Fly CLI
if (-not (Get-Command fly -ErrorAction SilentlyContinue)) {
    Write-Host "Fly CLI not found. Please install: https://fly.io/docs/hands-on/installing/"
    exit 1
}

# Build the Next.js app
Write-Host "Installing dependencies..."
npm install
Write-Host "Building Next.js app..."
npm run build

if ($BuildOnly) {
    Write-Host "Build complete. Skipping deploy."
    exit 0
}

# Deploy using fly.toml (auto-detects app name and config)
Write-Host "Deploying to Fly.io using fly.toml..."
fly deploy --remote-only

Write-Host "`nDeployment to Fly.io complete!"

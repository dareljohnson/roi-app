#!/usr/bin/env bash
# deploy-fly.sh - Deploy Next.js app to Fly.io
# Usage: ./deploy-fly.sh [--build-only]

set -e

APP_NAME="real-estate-investment-roi-app"

# Check for Fly CLI
if ! command -v fly &> /dev/null; then
  echo "Fly CLI not found. Please install: https://fly.io/docs/hands-on/installing/"
  exit 1
fi

# Build the Next.js app
npm install
npm run build

# Optionally only build
if [[ "$1" == "--build-only" ]]; then
  echo "Build complete. Skipping deploy."
  exit 0
fi

# Deploy to Fly.io
fly deploy --app "$APP_NAME" --remote-only

echo "\nDeployment to Fly.io complete!"

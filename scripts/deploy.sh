#!/bin/bash

# Real Estate ROI App Deployment Script for fly.io

echo "🏠 Deploying Real Estate Investment ROI Calculator to fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Please log in to fly.io first:"
    echo "   flyctl auth login"
    exit 1
fi

# Create volume for database (if it doesn't exist)
echo "📦 Creating database volume..."
flyctl volumes create database_vol --region ord --size 1 || echo "Volume may already exist"

# Deploy the application
echo "🚀 Deploying application..."
flyctl deploy

# Show status
echo "📊 Checking deployment status..."
flyctl status

echo "✅ Deployment complete!"
echo "🌐 Your application should be available at: https://real-estate-roi-app.fly.dev"
echo ""
echo "📋 Useful commands:"
echo "   flyctl logs                    - View application logs"
echo "   flyctl ssh console            - SSH into the application"
echo "   flyctl status                 - Check application status"
echo "   flyctl volumes list           - List volumes"
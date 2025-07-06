#!/bin/bash

# Fix for Rollup platform dependency issues
echo "🔧 Fixing Rollup platform dependencies..."

# Remove existing dependencies
echo "📦 Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Install fresh dependencies
echo "📥 Installing dependencies..."
npm install --legacy-peer-deps

echo "✅ Dependencies installed successfully!"
echo ""
echo "You can now run:"
echo "  npm run dev    - Start development server"
echo "  npm test       - Run tests"
echo "  npm run build  - Build for production"

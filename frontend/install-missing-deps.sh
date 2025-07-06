#!/bin/bash

echo "Installing missing dependencies..."
echo "=================================="

cd C:/Claude/ai-lifestyle-app/frontend

# Install missing packages
echo "Installing @headlessui/react..."
npm install @headlessui/react@latest

echo "Installing @types/node..."
npm install --save-dev @types/node@20

echo ""
echo "Dependencies installed! Now running build..."
echo ""

# Run type check and build
npm run type-check && npm run build

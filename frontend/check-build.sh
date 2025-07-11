#!/bin/bash

# Navigate to frontend directory
cd C:/Claude/ai-lifestyle-app/frontend

# Clean install dependencies (in case of any issues)
echo "Installing dependencies..."
npm install

# Run type check
echo "Running type check..."
npm run type-check

# If type check passes, attempt build
if [ $? -eq 0 ]; then
    echo "Type check passed! Attempting build..."
    npm run build
else
    echo "Type check failed. Please review the errors above."
fi

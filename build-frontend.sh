#!/bin/bash
echo "========================================="
echo "Building AI Lifestyle App Frontend"
echo "========================================="
echo ""
echo "Working directory: $(pwd)"
echo "Changing to frontend directory..."
cd frontend

echo ""
echo "Running TypeScript compilation and Vite build..."
echo "Command: npm run build"
echo ""

# Run the build
npm run build

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Build completed successfully!"
    echo "========================================="
else
    echo ""
    echo "========================================="
    echo "❌ Build failed! Check the errors above."
    echo "========================================="
    exit 1
fi

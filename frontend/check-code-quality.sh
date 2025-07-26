#!/bin/bash
echo "Running type check..."
cd /c/Claude/ai-lifestyle-app/frontend
npm run type-check
echo ""
echo "Running lint..."
npm run lint
echo ""
echo "Running format check..."
npm run format
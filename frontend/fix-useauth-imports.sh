#!/bin/bash

# Fix useAuth imports to use the correct path
echo "Fixing useAuth imports..."

# List of files that need fixing based on the error output
files=(
  "src/components/ProtectedRoute.tsx"
  "src/components/SessionWarning.tsx"
  "src/components/common/DevTools.tsx"
  "src/components/layout/Header.tsx"
  "src/components/layout/MobileMenu.tsx"
  "src/hooks/useSessionManagement.ts"
  "src/pages/DashboardPage.tsx"
)

for file in "${files[@]}"; do
  echo "Fixing $file..."
  # Change the import path from AuthContext to the parent directory
  sed -i "s|from '\.\./contexts/AuthContext'|from '../contexts'|g" "$file"
  sed -i "s|from '\.\./\.\./contexts/AuthContext'|from '../../contexts'|g" "$file"
done

echo "✓ Fixed useAuth imports"

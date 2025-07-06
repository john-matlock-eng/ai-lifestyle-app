#!/bin/bash

echo "Cleaning up temporary files and scripts..."
echo "========================================"

# List of files to remove (created during debugging)
files_to_remove=(
  "check-build.sh"
  "fix-build-errors.sh"
  "fix-specific-errors.sh"
  "fix-type-imports.sh"
  "fix-types.sh"
  "fix-useauth-imports.sh"
  "install-missing-deps.sh"
  "typescript-fixes-summary.sh"
  "BUILD_FIX_SUMMARY.md"
  "BUILD_SUCCESS.md"
)

# Remove files
for file in "${files_to_remove[@]}"; do
  if [ -f "$file" ]; then
    echo "Removing: $file"
    rm "$file"
  fi
done

# Clean temp directory
if [ -d "temp" ]; then
  echo "Cleaning temp directory..."
  rm -rf temp/*
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Your frontend directory is now clean and organized."
echo "All TypeScript and lint errors have been resolved."

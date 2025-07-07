#!/bin/bash
# Make all shell scripts executable

echo "Setting executable permissions on shell scripts..."

chmod +x terraform/generate-env.sh
chmod +x terraform/generate-env-simple.sh
chmod +x terraform/deploy.sh
chmod +x update-backend-values.sh
chmod +x aws-setup-checklist.sh
chmod +x cleanup-debug-files.sh

echo "Done! All scripts are now executable."

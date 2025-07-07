#!/bin/bash
# Generate basic environment configuration for frontend build
# This is a simplified version that doesn't require Terraform state

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: ./generate-env-simple.sh [dev|staging|prod]"
    exit 1
fi

echo "Generating .env file for $ENVIRONMENT environment..."

# Define environment-specific values
case "$ENVIRONMENT" in
    "dev")
        API_URL="${VITE_API_URL:-https://api-dev.ai-lifestyle.app}"
        COGNITO_USER_POOL_ID="${VITE_COGNITO_USER_POOL_ID:-us-east-1_dev}"
        COGNITO_CLIENT_ID="${VITE_COGNITO_CLIENT_ID:-dev-client-id}"
        ;;
    "prod")
        API_URL="${VITE_API_URL:-https://api.ai-lifestyle.app}"
        COGNITO_USER_POOL_ID="${VITE_COGNITO_USER_POOL_ID:-us-east-1_prod}"
        COGNITO_CLIENT_ID="${VITE_COGNITO_CLIENT_ID:-prod-client-id}"
        ;;
    *)
        echo "Error: Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Create .env.production file
cat > ../.env.production << EOF
VITE_ENVIRONMENT=$ENVIRONMENT
VITE_APP_NAME=AI Lifestyle App - $ENVIRONMENT
VITE_API_URL=$API_URL
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
VITE_ENABLE_MSW=false
VITE_DEBUG=false
EOF

echo "Generated .env.production file:"
cat ../.env.production

# Also create a .env.local for local development if in dev environment
if [ "$ENVIRONMENT" == "dev" ]; then
    cp ../.env.production ../.env.local
    echo "Also created .env.local for local development"
fi

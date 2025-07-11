#!/bin/bash
# Generate environment configuration for frontend build

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: ./generate-env.sh [dev|staging|prod]"
    exit 1
fi

echo "Generating .env file for $ENVIRONMENT environment..."

# Check if we're in the right directory
if [ ! -f "main.tf" ]; then
    echo "Error: This script must be run from the terraform directory"
    exit 1
fi

# Check if Terraform is initialized
if [ ! -d ".terraform" ]; then
    echo "Terraform not initialized. Initializing..."
    terraform init -backend-config=backend-$ENVIRONMENT.conf -upgrade
fi

# Check if Terraform state exists
echo "Checking Terraform state..."
terraform refresh -var-file=environments/$ENVIRONMENT.tfvars >/dev/null 2>&1 || true

# Get environment config from Terraform outputs
echo "Getting environment configuration from Terraform outputs..."
ENV_CONFIG=$(terraform output -json environment_config 2>/dev/null || echo "")

if [ -z "$ENV_CONFIG" ] || [ "$ENV_CONFIG" == "null" ] || [ "$ENV_CONFIG" == "" ]; then
    echo "Warning: Could not get environment configuration from Terraform outputs"
    echo "Using default values from tfvars file..."
    
    # Fallback: Create .env from tfvars if outputs aren't available yet
    if [ -f "environments/$ENVIRONMENT.tfvars" ]; then
        # Create a basic .env file with known values
        cat > ../.env.production << EOF
VITE_ENVIRONMENT=$ENVIRONMENT
VITE_APP_NAME=AI Lifestyle App - $ENVIRONMENT
VITE_API_URL=https://api.example.com
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=placeholder
VITE_COGNITO_CLIENT_ID=placeholder
EOF
        echo "Created placeholder .env.production file"
    else
        echo "Error: No tfvars file found for environment: $ENVIRONMENT"
        exit 1
    fi
else
    # Parse JSON and create .env file
    echo "$ENV_CONFIG" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"' > ../.env.production
    echo "Successfully generated .env.production from Terraform outputs"
fi

echo "Generated .env.production file:"
cat ../.env.production

# Also create a .env.local for local development if in dev environment
if [ "$ENVIRONMENT" == "dev" ]; then
    cp ../.env.production ../.env.local
    echo "Also created .env.local for local development"
fi

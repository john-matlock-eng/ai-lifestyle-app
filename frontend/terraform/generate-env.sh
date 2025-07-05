#!/bin/bash
# Generate environment configuration for frontend build

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: ./generate-env.sh [dev|staging|prod]"
    exit 1
fi

echo "Generating .env file for $ENVIRONMENT environment..."

# Initialize Terraform to get outputs
terraform init -backend-config=backend-$ENVIRONMENT.conf -upgrade >/dev/null 2>&1

# Get environment config from Terraform outputs
ENV_CONFIG=$(terraform output -json environment_config 2>/dev/null)

if [ -z "$ENV_CONFIG" ] || [ "$ENV_CONFIG" == "null" ]; then
    echo "Error: Could not get environment configuration from Terraform"
    exit 1
fi

# Parse JSON and create .env file
echo "$ENV_CONFIG" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"' > ../.env.production

echo "Generated .env.production file:"
cat ../.env.production

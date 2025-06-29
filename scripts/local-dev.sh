#!/bin/bash
# scripts/local-dev.sh
# Start local development environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting local development environment...${NC}"

# Start Docker Compose
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Create DynamoDB tables
echo -e "${YELLOW}Creating DynamoDB tables...${NC}"
aws dynamodb create-table \
    --table-name users-local \
    --attribute-definitions \
        AttributeName=user_id,AttributeType=S \
    --key-schema \
        AttributeName=user_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000 \
    2>/dev/null || echo "Table users-local already exists"

aws dynamodb create-table \
    --table-name main-local \
    --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
    --key-schema \
        AttributeName=pk,KeyType=HASH \
        AttributeName=sk,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000 \
    2>/dev/null || echo "Table main-local already exists"

echo -e "${GREEN}✓ Local environment ready!${NC}"
echo ""
echo "Services available:"
echo "  - DynamoDB: http://localhost:8000"
echo "  - DynamoDB Admin: http://localhost:8001"
echo "  - Lambda API: http://localhost:9000"
echo "  - Lambda Health: http://localhost:9001"
echo "  - LocalStack: http://localhost:4566"
echo ""
echo "Test Lambda locally:"
echo "  curl -X POST http://localhost:9000/2015-03-31/functions/function/invocations \\"
echo "    -d '{\"httpMethod\":\"GET\",\"path\":\"/health\"}'"
echo ""
echo "Stop environment:"
echo "  docker-compose down"

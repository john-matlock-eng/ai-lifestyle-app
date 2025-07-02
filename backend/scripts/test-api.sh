#!/bin/bash
# Test script for the deployed API endpoints

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get API endpoint from Terraform output
cd "$(dirname "$0")/../terraform"
API_ENDPOINT=$(terraform output -raw api_endpoint 2>/dev/null)

if [ -z "$API_ENDPOINT" ]; then
    echo -e "${RED}Error: Could not get API endpoint. Make sure Terraform has been applied.${NC}"
    exit 1
fi

echo -e "${GREEN}API Endpoint: $API_ENDPOINT${NC}"
echo ""

# Function to make API call and pretty print response
make_request() {
    local method=$1
    local path=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Request: $method $API_ENDPOINT$path"
    
    if [ -n "$data" ]; then
        echo "Body: $data"
        response=$(curl -s -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_ENDPOINT$path")
    else
        response=$(curl -s -X $method "$API_ENDPOINT$path")
    fi
    
    # Pretty print JSON response
    echo "Response:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Test 1: Health Check
make_request "GET" "/health" "" "Health Check Endpoint"

# Test 2: User Registration - Valid
TIMESTAMP=$(date +%s)
make_request "POST" "/auth/register" '{
    "email": "test'$TIMESTAMP'@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
}' "User Registration - Valid Request"

# Test 3: User Registration - Duplicate Email (should fail)
make_request "POST" "/auth/register" '{
    "email": "test'$TIMESTAMP'@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
}' "User Registration - Duplicate Email (should return 409)"

# Test 4: User Registration - Invalid Password
make_request "POST" "/auth/register" '{
    "email": "invalid'$TIMESTAMP'@example.com",
    "password": "weak",
    "firstName": "Test",
    "lastName": "User"
}' "User Registration - Invalid Password (should return 400)"

# Test 5: User Registration - Missing Fields
make_request "POST" "/auth/register" '{
    "email": "missing'$TIMESTAMP'@example.com"
}' "User Registration - Missing Fields (should return 400)"

echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Check CloudWatch Logs for detailed execution logs"
echo "2. Verify user was created in Cognito User Pool"
echo "3. Check DynamoDB table for user record"

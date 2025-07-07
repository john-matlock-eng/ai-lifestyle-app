#!/bin/bash
# Test API endpoints from command line

API_URL="https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"

echo "Testing AI Lifestyle App API..."
echo "==============================="
echo ""

# Test 1: Basic connectivity
echo "1. Testing API connectivity..."
curl -s -o /dev/null -w "Response Code: %{http_code}\n" $API_URL/
echo ""

# Test 2: Health check
echo "2. Testing health endpoint..."
curl -s -X GET $API_URL/health -H "Content-Type: application/json" | jq '.' || echo "No health endpoint or jq not installed"
echo ""

# Test 3: Login endpoint
echo "3. Testing login endpoint..."
echo "Request: POST $API_URL/auth/login"
echo "Body: {\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
echo ""
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control|{)"
echo ""

# Test 4: Login with username field
echo "4. Testing login with username field..."
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"Test123!"}' \
  -s | jq '.' || echo "Response not JSON"
echo ""

# Test 5: OPTIONS request (CORS preflight)
echo "5. Testing CORS preflight..."
curl -X OPTIONS $API_URL/auth/login \
  -H "Origin: https://your-cloudfront-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control)"
echo ""

echo "Common Issues:"
echo "- If you get 403: CORS not enabled"
echo "- If you get 404: Check if stage name is needed (e.g., /dev or /v1)"
echo "- If you get 400: Check request format (email vs username)"
echo "- If no Access-Control headers: CORS not configured"

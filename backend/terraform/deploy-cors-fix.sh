#!/bin/bash
# Deploy CORS fix for CloudFront domain

echo "Deploying CORS fix for CloudFront domain: d3qx4wyq22oaly.cloudfront.net"
echo "======================================================================="
echo ""

cd backend/terraform

echo "1. Running terraform plan..."
terraform plan

echo ""
echo "2. If the plan looks good, run:"
echo "   terraform apply"
echo ""
echo "3. After terraform apply completes:"
echo "   - The API Gateway will be updated with new CORS settings"
echo "   - Lambda environment will have the CloudFront URL"
echo ""
echo "4. IMPORTANT: Your Lambda functions must return CORS headers!"
echo "   Make sure your Lambda code includes:"
echo '   headers: {'
echo '     "Access-Control-Allow-Origin": process.env.CORS_ORIGIN,'
echo '     "Access-Control-Allow-Headers": "Content-Type,Authorization",'
echo '     "Access-Control-Allow-Methods": "OPTIONS,POST,GET"'
echo '   }'
echo ""
echo "5. After deployment, test from your CloudFront URL:"
echo "   https://d3qx4wyq22oaly.cloudfront.net"

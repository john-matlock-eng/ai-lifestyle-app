# CORS Configuration Update for Dev Environment

## Quick Update for your CloudFront Domain

In `backend/terraform/main.tf`, update the API Gateway module CORS configuration:

### Option 1: Quick Fix - Update main.tf directly

Find this section (around line 156):
```hcl
cors_origins = var.environment == "prod" ? ["https://ailifestyle.app"] : ["*"]
```

Replace with:
```hcl
cors_origins = var.environment == "prod" ? 
  ["https://ailifestyle.app"] : 
  ["https://d3qx4wyq22oaly.cloudfront.net", "http://localhost:3000", "http://localhost:5173"]
```

### Also update Lambda CORS_ORIGIN (around line 134):
```hcl
CORS_ORIGIN = var.environment == "prod" ? 
  "https://ailifestyle.app" : 
  "https://d3qx4wyq22oaly.cloudfront.net"
```

## Option 2: Better - Use Variables

### 1. Add to your terraform/environments/dev.tfvars:
```hcl
environment    = "dev"
aws_account_id = "YOUR_ACCOUNT_ID"
frontend_url   = "https://d3qx4wyq22oaly.cloudfront.net"
```

### 2. Add variable to terraform/variables.tf (if not exists):
```hcl
variable "frontend_url" {
  description = "Frontend CloudFront URL for CORS"
  type        = string
  default     = "*"
}
```

### 3. Update main.tf to use the variable:
```hcl
# API Gateway
cors_origins = var.frontend_url == "*" ? ["*"] : [var.frontend_url, "http://localhost:3000"]

# Lambda environment
CORS_ORIGIN = var.frontend_url
```

## Apply the Changes

```bash
cd backend/terraform

# If using Option 1 (direct edit):
terraform plan
terraform apply

# If using Option 2 (with variables):
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

## Important: Lambda Response Headers

Make sure your Lambda functions return the CORS headers. The Lambda code should include:

```javascript
return {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://d3qx4wyq22oaly.cloudfront.net',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(result)
};
```

This should fix your CORS issues for your specific CloudFront domain!

# CORS Fix for Backend Terraform

## Quick Fix - Update main.tf

In your `backend/terraform/main.tf`, update the API Gateway module section:

```hcl
# API Gateway
module "api_gateway" {
  source = "./modules/api-gateway"
  
  api_name             = "ai-lifestyle"
  environment          = var.environment
  description          = "AI Lifestyle App API Gateway"
  
  lambda_function_name = var.deploy_lambda && length(module.api_lambda) > 0 ? module.api_lambda[0].function_name : ""
  lambda_invoke_arn    = var.deploy_lambda && length(module.api_lambda) > 0 ? module.api_lambda[0].invoke_arn : ""
  
  # UPDATE THIS LINE - Add your CloudFront URLs
  cors_origins = var.environment == "prod" ? 
    ["https://ailifestyle.app", "https://your-cloudfront-domain.cloudfront.net"] : 
    ["*", "http://localhost:3000", "http://localhost:5173"]
  
  # ... rest of the configuration
}
```

## Solution 2: Ensure Lambda Returns CORS Headers

Your Lambda functions need to return CORS headers. Add this to your Lambda environment variables:

```hcl
# In main.tf, update the api_lambda module:
module "api_lambda" {
  count  = var.deploy_lambda ? 1 : 0
  source = "./modules/lambda-ecr"

  # ... other config ...

  environment_variables = {
    ENVIRONMENT          = var.environment
    LOG_LEVEL            = var.environment == "prod" ? "INFO" : "DEBUG"
    COGNITO_USER_POOL_ID = module.cognito.user_pool_id
    COGNITO_CLIENT_ID    = module.cognito.user_pool_client_id
    USERS_TABLE_NAME     = module.users_table.table_name
    # Add your actual CloudFront URL here
    CORS_ORIGIN          = var.environment == "prod" ? "https://your-prod-cloudfront.cloudfront.net" : "*"
  }

  # ... rest of the configuration
}
```

## Solution 3: Add a Terraform Variable for Frontend URL

Better approach - make it configurable:

### 1. Add to your terraform/variables.tf:
```hcl
variable "frontend_url" {
  description = "Frontend CloudFront URL for CORS"
  type        = string
  default     = "*"
}
```

### 2. Update main.tf:
```hcl
# API Gateway
module "api_gateway" {
  source = "./modules/api-gateway"
  
  # ... other config ...
  
  # Use the frontend URL variable
  cors_origins = var.frontend_url == "*" ? ["*"] : [var.frontend_url, "https://${var.frontend_url}"]
}

# Lambda environment variables
module "api_lambda" {
  # ... other config ...
  
  environment_variables = {
    # ... other vars ...
    CORS_ORIGIN = var.frontend_url
  }
}
```

### 3. Pass the variable when deploying:
```bash
terraform apply -var="frontend_url=https://d1234567890.cloudfront.net"
```

## Lambda Code Fix

Make sure your Lambda handler returns CORS headers:

```javascript
// In your Lambda handler
exports.handler = async (event) => {
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  
  try {
    // Your logic here
    const result = await handleRequest(event);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.code || 'INTERNAL_ERROR',
        message: error.message
      })
    };
  }
};
```

## Deploy the Fix

1. Update your Terraform configuration
2. Deploy:
```bash
cd backend/terraform
terraform plan
terraform apply
```

3. Rebuild and redeploy your Lambda functions to include CORS headers

This should fix your CORS issues permanently through infrastructure as code!

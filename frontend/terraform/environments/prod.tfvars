# Production Environment Configuration
environment = "prod"
aws_region  = "us-east-1"

# API Configuration (update with production API URL)
api_url = "https://api.ailifestyle.example.com"

# Cognito Configuration (update with actual values)
cognito_user_pool_id = ""
cognito_client_id    = ""

# CloudFront Configuration
price_class    = "PriceClass_All" # All edge locations for production
enable_logging = true              # Enable logging for production

# Custom domain
create_custom_domain = true
domain_name          = "app.ailifestyle.example.com"

# Production CORS should only allow the actual domain
allowed_origins = []

# Tags
tags = {
  CostCenter = "production"
  Owner      = "frontend-team"
  Critical   = "true"
}

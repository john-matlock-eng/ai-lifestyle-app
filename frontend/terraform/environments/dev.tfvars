# Development Environment Configuration
environment = "dev"
aws_region  = "us-east-1"

# API Configuration
api_url = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"

# Cognito Configuration (update with actual values)
cognito_user_pool_id = ""
cognito_client_id    = ""

# CloudFront Configuration
price_class    = "PriceClass_100" # US, Canada, Europe only for dev
enable_logging = false            # Disable logging for dev to save costs

# Custom domain (optional)
create_custom_domain = false
# domain_name = "dev.ailifestyle.example.com"

# Additional CORS origins for development
allowed_origins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173"
]

# Tags
tags = {
  CostCenter = "development"
  Owner      = "frontend-team"
}

# Infrastructure Plan: Authentication System

## 🏗️ AWS Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Route 53                                   │
│                    (ailifestyleapp.com)                             │
└─────────────────┬──────────────────────────┬───────────────────────┘
                  │                          │
                  ▼                          ▼
┌─────────────────────────┐       ┌──────────────────────────┐
│      CloudFront         │       │     API Gateway          │
│   (cdn.ailifestyle.com) │       │  (api.ailifestyle.com)   │
└────────────┬────────────┘       └───────────┬──────────────┘
             │                                 │
             ▼                                 ▼
┌─────────────────────────┐       ┌──────────────────────────┐
│      S3 Bucket          │       │   Lambda Functions       │
│   (React App Assets)    │       │   (Containerized)        │
└─────────────────────────┘       └───────────┬──────────────┘
                                              │
                     ┌────────────────────────┼────────────────────┐
                     │                        │                    │
                     ▼                        ▼                    ▼
        ┌───────────────────┐    ┌───────────────────┐  ┌──────────────┐
        │   AWS Cognito     │    │    DynamoDB       │  │     SES      │
        │   User Pool       │    │  (User Profiles)  │  │   (Email)    │
        └───────────────────┘    └───────────────────┘  └──────────────┘
```

## 📁 Terraform Module Structure

```
backend/terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── production/
├── modules/
│   ├── cloudfront/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── cognito/
│   │   ├── main.tf
│   │   ├── user-pool.tf
│   │   ├── clients.tf
│   │   └── outputs.tf
│   ├── api-gateway/
│   │   ├── main.tf
│   │   ├── routes.tf
│   │   └── outputs.tf
│   ├── lambda/
│   │   ├── main.tf
│   │   ├── iam.tf
│   │   └── outputs.tf
│   └── dynamodb/
│       ├── main.tf
│       └── outputs.tf
└── services/
    └── auth/
        ├── main.tf
        ├── lambda-functions.tf
        ├── api-routes.tf
        └── iam-policies.tf
```

## 🔧 Core Infrastructure Components

### 1. CloudFront + S3 (Frontend Hosting)
```hcl
module "frontend_hosting" {
  source = "../../modules/cloudfront"
  
  domain_name = "ailifestyleapp.com"
  s3_bucket_name = "${var.project}-frontend-${var.environment}"
  
  # Security headers
  security_headers = {
    "Strict-Transport-Security" = "max-age=31536000; includeSubDomains"
    "X-Content-Type-Options" = "nosniff"
    "X-Frame-Options" = "DENY"
    "X-XSS-Protection" = "1; mode=block"
    "Content-Security-Policy" = "default-src 'self' https://api.ailifestyleapp.com"
  }
  
  # Cache behaviors
  cache_behaviors = {
    "*.js" = 86400    # 1 day
    "*.css" = 86400   # 1 day
    "*.html" = 300    # 5 minutes
    "index.html" = 0  # No cache
  }
}
```

### 2. AWS Cognito Configuration
```hcl
module "cognito" {
  source = "../../modules/cognito"
  
  user_pool_name = "${var.project}-users-${var.environment}"
  
  # Password policy
  password_policy = {
    minimum_length = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers = true
    require_symbols = true
  }
  
  # MFA configuration
  mfa_configuration = "OPTIONAL"
  software_token_mfa_enabled = true
  
  # Email configuration
  email_configuration = {
    email_sending_account = "DEVELOPER"
    from_email_address = "noreply@ailifestyleapp.com"
    source_arn = aws_ses_email_identity.noreply.arn
  }
  
  # Account recovery
  account_recovery_setting = {
    recovery_mechanism {
      name = "verified_email"
      priority = 1
    }
  }
  
  # Schema attributes
  schema_attributes = [
    {
      name = "email"
      required = true
      mutable = false
    },
    {
      name = "given_name"
      required = true
      mutable = true
    },
    {
      name = "family_name"
      required = true
      mutable = true
    }
  ]
}
```

### 3. API Gateway Configuration
```hcl
module "api_gateway" {
  source = "../../modules/api-gateway"
  
  api_name = "${var.project}-api-${var.environment}"
  domain_name = "api.ailifestyleapp.com"
  
  # CORS configuration
  cors_configuration = {
    allow_origins = var.environment == "production" 
      ? ["https://ailifestyleapp.com"]
      : ["https://ailifestyleapp.com", "http://localhost:3000"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age = 3600
  }
  
  # Rate limiting
  throttle_settings = {
    rate_limit = 1000
    burst_limit = 2000
  }
  
  # Authorization
  authorizer = {
    type = "JWT"
    jwt_configuration = {
      issuer = module.cognito.user_pool_endpoint
      audience = [module.cognito.app_client_id]
    }
  }
}
```

### 4. DynamoDB Tables
```hcl
module "dynamodb_users" {
  source = "../../modules/dynamodb"
  
  table_name = "${var.project}-users-${var.environment}"
  
  # Primary key
  partition_key = "pk"  # USER#userId
  sort_key = "sk"       # PROFILE, SETTINGS, etc.
  
  # Global secondary indexes
  global_secondary_indexes = [
    {
      name = "EmailIndex"
      partition_key = "email"
      projection_type = "ALL"
    }
  ]
  
  # Backup configuration
  point_in_time_recovery_enabled = var.environment == "production"
  
  # Capacity
  billing_mode = "PAY_PER_REQUEST"
}
```

### 5. Lambda Function Configuration
```hcl
module "auth_lambdas" {
  source = "../../modules/lambda"
  
  for_each = {
    register_user = {
      memory = 256
      timeout = 30
    }
    login_user = {
      memory = 256
      timeout = 10
    }
    setup_mfa = {
      memory = 256
      timeout = 10
    }
    verify_mfa = {
      memory = 256
      timeout = 10
    }
  }
  
  function_name = "${var.project}-${each.key}-${var.environment}"
  runtime = "PROVIDED_AL2"  # Custom runtime for containers
  architectures = ["arm64"]
  
  # Container image
  package_type = "Image"
  image_uri = "${aws_ecr_repository.lambda_repo.repository_url}:${each.key}-latest"
  
  # Environment variables
  environment_variables = {
    ENVIRONMENT = var.environment
    COGNITO_USER_POOL_ID = module.cognito.user_pool_id
    COGNITO_CLIENT_ID = module.cognito.app_client_id
    USERS_TABLE_NAME = module.dynamodb_users.table_name
    LOG_LEVEL = var.environment == "production" ? "INFO" : "DEBUG"
  }
  
  # Tracing
  tracing_config = {
    mode = "Active"
  }
}
```

## 🔐 Security Configuration

### WAF Rules for CloudFront
```hcl
resource "aws_wafv2_web_acl" "cloudfront_waf" {
  name = "${var.project}-waf-${var.environment}"
  scope = "CLOUDFRONT"
  
  # Rate limiting rule
  rule {
    name = "RateLimitRule"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit = 2000
        aggregate_key_type = "IP"
      }
    }
  }
  
  # Geo blocking (if needed)
  rule {
    name = "GeoBlockingRule"
    priority = 2
    
    action {
      block {}
    }
    
    statement {
      geo_match_statement {
        country_codes = var.blocked_countries
      }
    }
  }
}
```

### API Gateway Resource Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "execute-api:Invoke",
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "execute-api:Invoke",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:SourceVpc": "${var.vpc_id}"
        }
      }
    }
  ]
}
```

## 🚀 CI/CD Pipeline Configuration

### GitHub Actions Workflow
```yaml
name: Deploy Infrastructure

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'backend/terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE }}
          aws-region: us-east-1
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Terraform Init
        run: |
          cd backend/terraform/environments/${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
          terraform init
      
      - name: Terraform Plan
        run: |
          cd backend/terraform/environments/${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
          terraform plan -out=tfplan
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
        run: |
          cd backend/terraform/environments/${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
          terraform apply -auto-approve tfplan
```

## 📊 Monitoring & Alerting

### CloudWatch Dashboards
```hcl
resource "aws_cloudwatch_dashboard" "auth_dashboard" {
  dashboard_name = "${var.project}-auth-${var.environment}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project}-register-user-${var.environment}"],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", ".", { stat = "Average" }]
          ]
          period = 300
          stat = "Sum"
          region = var.aws_region
          title = "Registration Lambda Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Cognito", "UserAuthentication", "UserPool", module.cognito.user_pool_id]
          ]
          period = 300
          stat = "Sum"
          region = var.aws_region
          title = "Authentication Attempts"
        }
      }
    ]
  })
}
```

### Alarms
```hcl
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(["register-user", "login-user"])
  
  alarm_name = "${var.project}-${each.key}-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods = "2"
  metric_name = "Errors"
  namespace = "AWS/Lambda"
  period = "300"
  statistic = "Sum"
  threshold = "10"
  alarm_description = "This metric monitors lambda errors"
  
  dimensions = {
    FunctionName = "${var.project}-${each.key}-${var.environment}"
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

## 🔄 Deployment Steps

1. **Prerequisites**
   ```bash
   # Install tools
   brew install terraform awscli
   
   # Configure AWS credentials
   aws configure --profile ailifestyle-dev
   ```

2. **Deploy Infrastructure**
   ```bash
   cd backend/terraform/environments/dev
   terraform init
   terraform plan
   terraform apply
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   aws s3 sync build/ s3://ailifestyle-frontend-dev/
   aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
   ```

4. **Deploy Lambda Functions**
   ```bash
   cd backend
   make build-all
   make deploy-all ENV=dev
   ```

## 📈 Cost Estimation

### Monthly Cost Breakdown (Estimated)
- CloudFront: $20-50 (depending on traffic)
- S3: $5-10 (static hosting)
- API Gateway: $3.50 per million requests
- Lambda: $0.20 per million requests
- Cognito: $0.0055 per MAU
- DynamoDB: $0.25 per GB + request costs
- **Total**: ~$50-100/month for moderate usage

### Cost Optimization
- Use CloudFront caching aggressively
- Enable S3 lifecycle policies
- Use DynamoDB on-demand pricing
- Monitor and optimize Lambda memory
- Use Reserved Capacity for production
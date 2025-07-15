# Example usage of modules - replace current main.tf content with module-based approach

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.82"
    }
  }

  backend "s3" {
    # Backend config provided via CLI in GitHub Actions
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "john-matlock-eng/ai-lifestyle-app"
    }
  }
}

# Variables
variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "deploy_lambda" {
  description = "Whether to deploy Lambda functions (set to false for initial deployment)"
  type        = bool
  default     = false # Keep false for phased deployment in CI/CD
}

variable "api_handler_image_tag" {
  description = "Docker image tag for API handler Lambda"
  type        = string
  default     = "latest"
}

# ECR Repository for Lambda images
module "app_ecr" {
  source = "./modules/ecr"

  repository_name = "lifestyle-app"
  environment     = var.environment
  scan_on_push    = true
}

# Cognito User Pool for authentication
module "cognito" {
  source = "./modules/cognito"

  project              = "ai-lifestyle"
  project_display_name = "AI Lifestyle App"
  environment          = var.environment
  use_ses_for_email    = false

  tags = {
    Service = "auth"
  }
}

# DynamoDB Tables
module "users_table" {
  source = "./modules/dynamodb"

  table_name  = "users"
  environment = var.environment

  hash_key = {
    name = "pk"
    type = "S"
  }

  range_key = {
    name = "sk"
    type = "S"
  }

  global_secondary_indexes = [{
    name            = "EmailIndex"
    hash_key        = "gsi1_pk"
    range_key       = "gsi1_sk"
    projection_type = "ALL"
  }]

  additional_attributes = [
    {
      name = "gsi1_pk"
      type = "S"
    },
    {
      name = "gsi1_sk"
      type = "S"
    }
  ]
}

# Goals Service Infrastructure
module "goals_service" {
  source = "./services/goals"

  app_name     = "ai-lifestyle"
  environment  = var.environment
  aws_region   = var.aws_region
  
  tags = {
    Service = "goals"
  }
}

# Journal Service Infrastructure
module "journal_service" {
  source = "./services/journal"

  app_name     = "ai-lifestyle"
  environment  = var.environment
  aws_region   = var.aws_region
  
  tags = {
    Service = "journal"
  }
}

# Encryption Service Infrastructure
module "encryption_service" {
  source = "./services/encryption"

  app_name     = "ai-lifestyle"
  environment  = var.environment
  aws_region   = var.aws_region
  
  tags = {
    Service = "encryption"
  }
}

# Lambda Function for API handling
module "api_lambda" {
  count  = var.deploy_lambda ? 1 : 0
  source = "./modules/lambda-ecr"

  function_name = "api-handler"
  environment   = var.environment
  ecr_image_uri = "${module.app_ecr.repository_url}:${var.api_handler_image_tag}"

  environment_variables = {
    ENVIRONMENT          = var.environment
    LOG_LEVEL            = var.environment == "prod" ? "INFO" : "DEBUG"
    COGNITO_USER_POOL_ID = module.cognito.user_pool_id
    COGNITO_CLIENT_ID    = module.cognito.user_pool_client_id
    USERS_TABLE_NAME     = module.users_table.table_name
    # Single table for all entities
    TABLE_NAME      = module.users_table.table_name # Main table for everything!
    MAIN_TABLE_NAME = module.users_table.table_name # Same table
    # Goals environment variables
    GOAL_ATTACHMENTS_BUCKET = module.goals_service.goal_attachments_bucket_name
    # Journal environment variables
    JOURNAL_ATTACHMENTS_BUCKET = module.journal_service.journal_attachments_bucket_name
    # Encryption environment variables
    AI_SERVICE_PUBLIC_KEY_PARAM = module.encryption_service.ai_service_public_key_parameter
    AI_ANALYSIS_QUEUE_URL = module.encryption_service.ai_analysis_queue_url
    CORS_ORIGIN                = var.environment == "prod" ? "https://ailifestyle.app" : "*"
    # Feature flags
    FEATURE_FLAG_DEBUG_PANELS = var.environment == "prod" ? "false" : "true"
  }

  additional_policies = [
    module.users_table.access_policy_arn,
    aws_iam_policy.cognito_access.arn,
    aws_iam_policy.main_table_dynamodb_access.arn,
    aws_iam_policy.goals_s3_access.arn,
    aws_iam_policy.journal_s3_access.arn,
    aws_iam_policy.encryption_service_access.arn
  ]
}

# Goals Lambda Function - REMOVED: Using single Lambda pattern
# The api_lambda handles all routes including goals via main.py

# API Gateway
module "api_gateway" {
  source = "./modules/api-gateway"

  api_name    = "ai-lifestyle"
  environment = var.environment
  description = "AI Lifestyle App API Gateway"

  lambda_function_name = var.deploy_lambda && length(module.api_lambda) > 0 ? module.api_lambda[0].function_name : ""
  lambda_invoke_arn    = var.deploy_lambda && length(module.api_lambda) > 0 ? module.api_lambda[0].invoke_arn : ""

  cors_origins = var.environment == "prod" ? ["https://ailifestyle.app"] : ["https://d3qx4wyq22oaly.cloudfront.net", "http://localhost:3000", "http://localhost:5173"]

  # Define auth and user routes (handled by api_lambda)
  routes = {
    # Health check
    "GET /health" = {
      authorization_type = "NONE"
    }

    # Debug endpoint (temporary)
    "GET /debug" = {
      authorization_type = "NONE"
    }

    # Feature flags endpoint
    "GET /config/features" = {
      authorization_type = "NONE"
    }

    # Authentication endpoints (public)
    "POST /auth/register" = {
      authorization_type = "NONE"
    }
    "POST /auth/register-test" = {
      authorization_type = "NONE"
    }
    "POST /auth/login" = {
      authorization_type = "NONE"
    }
    "POST /auth/refresh" = {
      authorization_type = "NONE"
    }
    "POST /auth/password/reset-request" = {
      authorization_type = "NONE"
    }
    "POST /auth/password/reset-confirm" = {
      authorization_type = "NONE"
    }
    "POST /auth/email/verify" = {
      authorization_type = "NONE"
    }

    # User endpoints
    "GET /users/profile" = {
      authorization_type = "JWT"
    }
    "GET /users/by-email/{email}" = {
      authorization_type = "JWT"
    }
    "GET /users/{userId}" = {
      authorization_type = "JWT"
    }
    "PUT /users/profile" = {
      authorization_type = "JWT"
    }

    # 2FA endpoints
    "POST /auth/mfa/setup" = {
      authorization_type = "JWT"
    }
    "POST /auth/mfa/verify-setup" = {
      authorization_type = "JWT"
    }
    "POST /auth/mfa/verify" = {
      authorization_type = "NONE"  # This is part of login flow, no JWT yet
    }
    "POST /auth/mfa/disable" = {
      authorization_type = "JWT"
    }

    # Goals endpoints - handled by main Lambda
    "GET /goals" = {
      authorization_type = "JWT"
    }
    "POST /goals" = {
      authorization_type = "JWT"
    }
    "GET /goals/{goalId}" = {
      authorization_type = "JWT"
    }
    "PUT /goals/{goalId}" = {
      authorization_type = "JWT"
    }
    "DELETE /goals/{goalId}" = {
      authorization_type = "JWT"
    }
    "GET /goals/{goalId}/activities" = {
      authorization_type = "JWT"
    }
    "POST /goals/{goalId}/activities" = {
      authorization_type = "JWT"
    }
    "GET /goals/{goalId}/progress" = {
      authorization_type = "JWT"
    }

    # Journal endpoints
    "GET /journal" = {
      authorization_type = "JWT"
    }
    "POST /journal" = {
      authorization_type = "JWT"
    }
    "GET /journal/{entryId}" = {
      authorization_type = "JWT"
    }
    "PUT /journal/{entryId}" = {
      authorization_type = "JWT"
    }
    "DELETE /journal/{entryId}" = {
      authorization_type = "JWT"
    }
    "GET /journal/stats" = {
      authorization_type = "JWT"
    }

    # Encryption endpoints
    "POST /encryption/setup" = {
      authorization_type = "JWT"
    }
    "GET /encryption/check/{userId}" = {
      authorization_type = "NONE"  # Public endpoint to check if user has encryption
    }
    "GET /encryption/user/{userId}" = {
      authorization_type = "JWT"  # Get user's public key
    }
    "POST /encryption/shares" = {
      authorization_type = "JWT"
    }
    "GET /encryption/shares" = {
      authorization_type = "JWT"
    }
    "POST /encryption/ai-shares" = {
      authorization_type = "JWT"
    }
    "DELETE /encryption/shares/{shareId}" = {
      authorization_type = "JWT"
    }
    "POST /encryption/recovery" = {
      authorization_type = "JWT"
    }
    "POST /encryption/recovery/attempt" = {
      authorization_type = "NONE"  # Recovery doesn't require auth
    }
    "DELETE /encryption/keys" = {
      authorization_type = "JWT"
    }
  }

  # JWT authorizer configuration
  enable_jwt_authorizer = true
  jwt_issuer            = "https://cognito-idp.${var.aws_region}.amazonaws.com/${module.cognito.user_pool_id}"
  jwt_audience          = [module.cognito.user_pool_client_id]

  tags = {
    Service = "api"
  }

  depends_on = [module.api_lambda]
}

# IAM Policy for Cognito access
resource "aws_iam_policy" "cognito_access" {
  name        = "ai-lifestyle-cognito-access-${var.environment}"
  description = "Policy for Lambda to access Cognito User Pool"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminUserGlobalSignOut",
          "cognito-idp:AdminDeleteUser",
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminRespondToAuthChallenge",
          "cognito-idp:InitiateAuth",
          "cognito-idp:GetUser"
        ]
        Resource = module.cognito.user_pool_arn
      }
    ]
  })
}

# IAM Policy for Main Table DynamoDB access (replaces goals-specific policy)
resource "aws_iam_policy" "main_table_dynamodb_access" {
  name        = "ai-lifestyle-main-table-${var.environment}"
  description = "Policy for Lambda to access main DynamoDB table"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = [
          module.users_table.table_arn,
          "${module.users_table.table_arn}/*"
        ]
      }
    ]
  })
}

# IAM Policy for Goals S3 access
resource "aws_iam_policy" "goals_s3_access" {
  name        = "ai-lifestyle-goals-s3-${var.environment}"
  description = "Policy for Lambda to access Goals S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          module.goals_service.goal_attachments_bucket_arn,
          "${module.goals_service.goal_attachments_bucket_arn}/*"
        ]
      }
    ]
  })
}

# IAM Policy for Journal S3 access
resource "aws_iam_policy" "journal_s3_access" {
  name        = "ai-lifestyle-journal-s3-${var.environment}"
  description = "Policy for Lambda to access Journal S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          module.journal_service.journal_attachments_bucket_arn,
          "${module.journal_service.journal_attachments_bucket_arn}/*"
        ]
      }
    ]
  })
}

# IAM Policy for Encryption Service access
resource "aws_iam_policy" "encryption_service_access" {
  name        = "ai-lifestyle-encryption-${var.environment}"
  description = "Policy for Lambda to access encryption service resources"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter/ai-lifestyle-app/ai-service/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = module.encryption_service.ai_analysis_queue_arn
      }
    ]
  })
}

# Outputs
output "ecr_repository_url" {
  description = "ECR repository URL for pushing images"
  value       = module.app_ecr.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = module.app_ecr.repository_name
}

output "dynamodb_table_name" {
  description = "DynamoDB users table name"
  value       = module.users_table.table_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.user_pool_client_id
}

output "api_lambda_arn" {
  description = "API Lambda function ARN"
  value       = var.deploy_lambda && length(module.api_lambda) > 0 ? module.api_lambda[0].function_arn : "Not deployed"
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api_gateway.api_endpoint
}

output "api_id" {
  description = "API Gateway ID"
  value       = module.api_gateway.api_id
}

output "main_table_name" {
  description = "Main DynamoDB table name (used for all entities)"
  value       = module.users_table.table_name
}

output "goal_attachments_bucket_name" {
  description = "Goal attachments S3 bucket name"
  value       = module.goals_service.goal_attachments_bucket_name
}

output "journal_attachments_bucket_name" {
  description = "Journal attachments S3 bucket name"
  value       = module.journal_service.journal_attachments_bucket_name
}

output "ai_analysis_queue_url" {
  description = "AI analysis SQS queue URL"
  value       = module.encryption_service.ai_analysis_queue_url
}

output "encryption_log_group_name" {
  description = "CloudWatch log group for encryption service"
  value       = module.encryption_service.encryption_log_group_name
}

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
  description = "Whether to deploy Lambda functions"
  type        = bool
  default     = true
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
    CORS_ORIGIN          = var.environment == "prod" ? "https://ailifestyle.app" : "*"
  }

  additional_policies = [
    module.users_table.access_policy_arn,
    aws_iam_policy.cognito_access.arn
  ]
}

# Example: API Gateway (after Lambda is created)
# module "api" {
#   source = "./modules/api-gateway"
#   
#   api_name    = "lifestyle"
#   environment = var.environment
#   
#   routes = {
#     "/health" = {
#       method               = "GET"
#       lambda_invoke_arn    = module.api_lambda.invoke_arn
#       lambda_function_name = module.api_lambda.function_name
#     }
#   }
# }

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
          "cognito-idp:AdminRespondToAuthChallenge"
        ]
        Resource = module.cognito.user_pool_arn
      }
    ]
  })
}

# Policy ARN will be referenced directly from the resource

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
  value       = var.deploy_lambda && length(module.api_lambda) > 0 ? module.api_lambda[0].lambda_function_arn : "Not deployed"
}

output "api_lambda_name" {
  description = "API Lambda function name"
  value       = var.deploy_lambda && length(module.api_lambda) > 0 ? module.api_lambda[0].lambda_function_name : "Not deployed"
}

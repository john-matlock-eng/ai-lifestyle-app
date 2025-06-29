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

# Example: ECR Repository
module "app_ecr" {
  source = "./modules/ecr"
  
  repository_name = "lifestyle-app"
  environment     = var.environment
  scan_on_push    = true
}

# Example: DynamoDB Table
module "main_table" {
  source = "./modules/dynamodb"
  
  table_name  = "main"
  environment = var.environment
  
  hash_key = {
    name = "pk"
    type = "S"
  }
  
  range_key = {
    name = "sk"
    type = "S"
  }
}

# Example: Lambda Function (after ECR image is pushed)
# module "api_lambda" {
#   source = "./modules/lambda-ecr"
#   
#   function_name = "api-handler"
#   environment   = var.environment
#   ecr_image_uri = "${module.app_ecr.repository_url}:latest"
#   
#   environment_variables = {
#     TABLE_NAME = module.main_table.table_name
#   }
#   
#   additional_policies = [
#     module.main_table.access_policy_arn
#   ]
# }

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
  description = "DynamoDB table name"
  value       = module.main_table.table_name
}

output "dynamodb_access_policy_arn" {
  description = "IAM policy ARN for DynamoDB access"
  value       = module.main_table.access_policy_arn
}

# Uncomment when Lambda and API modules are activated
# output "api_endpoint" {
#   description = "API Gateway endpoint URL"
#   value       = module.api.invoke_url
# }

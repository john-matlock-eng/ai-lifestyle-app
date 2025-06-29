# Development Environment Configuration

module "infrastructure" {
  source = "../../"
  
  environment    = "dev"
  aws_account_id = var.aws_account_id
  aws_region     = var.aws_region
  
  # Dev-specific overrides
  lambda_config = {
    memory_size        = 512  # Lower memory for dev
    timeout            = 30
    log_retention_days = 3
  }
  
  dynamodb_config = {
    billing_mode = "PAY_PER_REQUEST"
    deletion_protection = false
  }
  
  api_config = {
    throttle_burst_limit = 100
    throttle_rate_limit  = 50
    cors_allow_origins   = ["*"]  # Allow all origins in dev
  }
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

output "api_url" {
  value = module.infrastructure.api_endpoint
}

output "ecr_repository_url" {
  value = module.infrastructure.ecr_repository_url
}

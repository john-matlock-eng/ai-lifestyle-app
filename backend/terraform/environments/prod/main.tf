# Production Environment Configuration

module "infrastructure" {
  source = "../../"
  
  environment    = "prod"
  aws_account_id = var.aws_account_id
  aws_region     = var.aws_region
  
  # Prod-specific configuration
  lambda_config = {
    memory_size        = 1024  # Higher memory for prod
    timeout            = 60
    log_retention_days = 30
    reserved_concurrent_executions = 100
  }
  
  dynamodb_config = {
    billing_mode = "PAY_PER_REQUEST"
    deletion_protection = true
    point_in_time_recovery = true
  }
  
  api_config = {
    throttle_burst_limit = 2000
    throttle_rate_limit  = 1000
    cors_allow_origins   = ["https://app.example.com"]  # Restrict origins in prod
  }
  
  # Production monitoring
  enable_detailed_monitoring = true
  enable_xray_tracing       = true
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

output "monitoring_dashboard_url" {
  value = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=ai-lifestyle-prod"
}

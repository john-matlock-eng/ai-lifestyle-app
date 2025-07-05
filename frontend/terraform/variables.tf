variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ai-lifestyle-app"
}

variable "domain_name" {
  description = "Custom domain name for the frontend (optional)"
  type        = string
  default     = ""
}

variable "create_custom_domain" {
  description = "Whether to create custom domain resources"
  type        = bool
  default     = false
}

variable "api_url" {
  description = "Backend API URL"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
  default     = ""
}

variable "cognito_client_id" {
  description = "Cognito Client ID"
  type        = string
  default     = ""
}

variable "allowed_origins" {
  description = "Additional allowed origins for CORS"
  type        = list(string)
  default     = ["http://localhost:3000", "http://localhost:5173"]
}

variable "enable_logging" {
  description = "Enable CloudFront logging"
  type        = bool
  default     = true
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100" # US, Canada, Europe
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

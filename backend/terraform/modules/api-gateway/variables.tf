variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "description" {
  description = "API description"
  type        = string
  default     = ""
}

variable "routes" {
  description = "Map of route keys to route configuration"
  type = map(object({
    authorization_type = optional(string, "NONE")
  }))
  default = {}
}

variable "lambda_function_name" {
  description = "Name of the Lambda function to integrate"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Invoke ARN of the Lambda function"
  type        = string
}

variable "cors_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "throttle_rate_limit" {
  description = "API throttling rate limit (requests per second)"
  type        = number
  default     = 100
}

variable "throttle_burst_limit" {
  description = "API throttling burst limit"
  type        = number
  default     = 200
}

variable "enable_jwt_authorizer" {
  description = "Enable JWT authorizer for protected routes"
  type        = bool
  default     = false
}

variable "jwt_audience" {
  description = "JWT audience for the authorizer"
  type        = list(string)
  default     = []
}

variable "jwt_issuer" {
  description = "JWT issuer URL"
  type        = string
  default     = ""
}

variable "custom_domain_name" {
  description = "Custom domain name for the API"
  type        = string
  default     = null
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain"
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
}

variable "environment" {
  description = "Environment (dev, prod)"
  type        = string
}

variable "description" {
  description = "Description of the API"
  type        = string
  default     = ""
}

variable "routes" {
  description = "Map of routes to configure"
  type = map(object({
    method             = string
    lambda_invoke_arn  = string
    lambda_function_name = string
    authorization_type = optional(string, "NONE")
    authorizer_id      = optional(string)
    api_key_required   = optional(bool, false)
    request_parameters = optional(map(string), {})
    throttle_burst_limit = optional(number)
    throttle_rate_limit  = optional(number)
  }))
}

variable "cors_configuration" {
  description = "CORS configuration"
  type = object({
    allow_origins     = list(string)
    allow_methods     = list(string)
    allow_headers     = list(string)
    expose_headers    = list(string)
    max_age          = number
    allow_credentials = bool
  })
  default = {
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token"]
    expose_headers    = ["x-request-id"]
    max_age          = 300
    allow_credentials = false
  }
}

variable "stage_name" {
  description = "Deployment stage name"
  type        = string
  default     = "v1"
}

variable "throttle_settings" {
  description = "Default throttle settings"
  type = object({
    burst_limit = number
    rate_limit  = number
  })
  default = {
    burst_limit = 1000
    rate_limit  = 500
  }
}

variable "access_log_settings" {
  description = "Access log settings"
  type = object({
    destination_arn = string
    format         = string
  })
  default = null
}

variable "custom_domain" {
  description = "Custom domain configuration"
  type = object({
    domain_name     = string
    certificate_arn = string
    base_path       = optional(string, "")
  })
  default = null
}

variable "api_key_source" {
  description = "Source of the API key for requests"
  type        = string
  default     = "HEADER"
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "secret_name" {
  description = "Base name of the secret"
  type        = string
  default     = "openai_api_key"
}

variable "description" {
  description = "Secret description"
  type        = string
  default     = "AI Lifestyle App – OpenAI key"
}

variable "tags" {
  description = "Tags for resources"
  type        = map(string)
  default     = {}
}

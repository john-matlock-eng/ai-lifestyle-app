variable "project" {
  description = "Project name"
  type        = string
}

variable "project_display_name" {
  description = "Project display name for user-facing content"
  type        = string
  default     = "AI Lifestyle App"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "use_ses_for_email" {
  description = "Whether to use SES for sending emails (requires verified domain)"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

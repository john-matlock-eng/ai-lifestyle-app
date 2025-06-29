variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "environment" {
  description = "Environment (dev, prod)"
  type        = string
}

variable "billing_mode" {
  description = "DynamoDB billing mode (PROVISIONED or PAY_PER_REQUEST)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "read_capacity" {
  description = "Read capacity units (only for PROVISIONED mode)"
  type        = number
  default     = 5
}

variable "write_capacity" {
  description = "Write capacity units (only for PROVISIONED mode)"
  type        = number
  default     = 5
}

variable "hash_key" {
  description = "Hash key configuration"
  type = object({
    name = string
    type = string  # S, N, or B
  })
}

variable "range_key" {
  description = "Range key configuration (optional)"
  type = object({
    name = string
    type = string  # S, N, or B
  })
  default = null
}

variable "attributes" {
  description = "Additional attributes for GSI/LSI"
  type = list(object({
    name = string
    type = string  # S, N, or B
  }))
  default = []
}

variable "global_secondary_indexes" {
  description = "Global secondary indexes"
  type = list(object({
    name               = string
    hash_key           = string
    range_key          = optional(string)
    projection_type    = optional(string, "ALL")  # ALL, KEYS_ONLY, INCLUDE
    projection_attributes = optional(list(string), [])
    read_capacity      = optional(number, 5)
    write_capacity     = optional(number, 5)
  }))
  default = []
}

variable "local_secondary_indexes" {
  description = "Local secondary indexes"
  type = list(object({
    name               = string
    range_key          = string
    projection_type    = optional(string, "ALL")  # ALL, KEYS_ONLY, INCLUDE
    projection_attributes = optional(list(string), [])
  }))
  default = []
}

variable "ttl_attribute" {
  description = "TTL attribute name (optional)"
  type        = string
  default     = ""
}

variable "stream_enabled" {
  description = "Enable DynamoDB Streams"
  type        = bool
  default     = false
}

variable "stream_view_type" {
  description = "DynamoDB Stream view type"
  type        = string
  default     = "NEW_AND_OLD_IMAGES"
}

variable "point_in_time_recovery" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "server_side_encryption" {
  description = "Server-side encryption configuration"
  type = object({
    enabled     = bool
    kms_key_arn = optional(string)
  })
  default = {
    enabled = true
  }
}

variable "autoscaling_enabled" {
  description = "Enable autoscaling (only for PROVISIONED mode)"
  type        = bool
  default     = false
}

variable "autoscaling_config" {
  description = "Autoscaling configuration"
  type = object({
    read_min_capacity  = number
    read_max_capacity  = number
    read_target_value  = number
    write_min_capacity = number
    write_max_capacity = number
    write_target_value = number
  })
  default = {
    read_min_capacity  = 5
    read_max_capacity  = 100
    read_target_value  = 70
    write_min_capacity = 5
    write_max_capacity = 100
    write_target_value = 70
  }
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

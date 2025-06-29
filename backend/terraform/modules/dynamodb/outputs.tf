output "table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.this.name
}

output "table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.this.arn
}

output "table_id" {
  description = "ID of the DynamoDB table"
  value       = aws_dynamodb_table.this.id
}

output "stream_arn" {
  description = "ARN of the DynamoDB stream"
  value       = var.stream_enabled ? aws_dynamodb_table.this.stream_arn : null
}

output "access_policy_arn" {
  description = "ARN of the IAM policy for table access"
  value       = aws_iam_policy.table_access.arn
}

output "hash_key" {
  description = "Hash key name"
  value       = var.hash_key.name
}

output "range_key" {
  description = "Range key name"
  value       = var.range_key != null ? var.range_key.name : null
}

output "global_secondary_indexes" {
  description = "List of GSI names"
  value       = [for idx in var.global_secondary_indexes : idx.name]
}

output "local_secondary_indexes" {
  description = "List of LSI names"
  value       = [for idx in var.local_secondary_indexes : idx.name]
}

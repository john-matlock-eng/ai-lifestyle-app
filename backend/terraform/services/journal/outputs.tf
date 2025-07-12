output "bucket_name" {
  value       = aws_s3_bucket.journal_attachments.id
  description = "Name of the S3 bucket for journal attachments"
}

output "bucket_arn" {
  value       = aws_s3_bucket.journal_attachments.arn
  description = "ARN of the S3 bucket for journal attachments"
}

output "notifications_topic_arn" {
  value       = aws_sns_topic.journal_notifications.arn
  description = "ARN of the SNS topic for journal notifications"
}

output "stats_aggregator_rule_name" {
  value       = aws_cloudwatch_event_rule.journal_stats_aggregator.name
  description = "Name of the EventBridge rule for journal stats aggregation"
}

output "stats_aggregator_rule_arn" {
  value       = aws_cloudwatch_event_rule.journal_stats_aggregator.arn
  description = "ARN of the EventBridge rule for journal stats aggregation"
}
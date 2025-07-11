# Goals Service Infrastructure
# Supports the Enhanced Goal System with 5 goal patterns

locals {
  service_name = "goals"
  
  default_tags = {
    Service     = local.service_name
    Module      = "goals"
    Description = "Enhanced Goal System infrastructure"
  }
  
  tags = merge(local.default_tags, var.tags)
}

# REMOVED: DynamoDB tables for goals
# Using single-table design with the main application table instead
# Goals are stored in the main table with:
# - PK: USER#<userId>
# - SK: GOAL#<goalId> or ACTIVITY#<goalId>#<timestamp>
# See terraform/main.tf for the main table configuration

# S3 Bucket for activity attachments (images, etc.)
resource "aws_s3_bucket" "goal_attachments" {
  bucket = "${var.app_name}-goal-attachments-${var.environment}"
  
  tags = merge(local.tags, {
    Name = "${var.app_name}-goal-attachments-${var.environment}"
  })
}

resource "aws_s3_bucket_versioning" "goal_attachments" {
  bucket = aws_s3_bucket.goal_attachments.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "goal_attachments" {
  bucket = aws_s3_bucket.goal_attachments.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "goal_attachments" {
  bucket = aws_s3_bucket.goal_attachments.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "goal_attachments" {
  bucket = aws_s3_bucket.goal_attachments.id
  
  rule {
    id     = "cleanup-old-attachments"
    status = "Enabled"
    
    # Add filter to satisfy the warning
    filter {}
    
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 180
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
}

# S3 Bucket Policy for Lambda access
data "aws_iam_policy_document" "goal_attachments_policy" {
  statement {
    effect = "Allow"
    
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    
    resources = [
      "${aws_s3_bucket.goal_attachments.arn}/*"
    ]
    
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_s3_bucket_policy" "goal_attachments" {
  bucket = aws_s3_bucket.goal_attachments.id
  policy = data.aws_iam_policy_document.goal_attachments_policy.json
}

# EventBridge Rule for Goal Streaks Processing
# Runs daily at 1 AM UTC to update streak counters
resource "aws_cloudwatch_event_rule" "goal_streak_processor" {
  name                = "${var.app_name}-goal-streak-processor-${var.environment}"
  description         = "Daily goal streak processing"
  schedule_expression = "cron(0 1 * * ? *)" # 1 AM UTC daily
  
  tags = local.tags
}

# EventBridge Rule for Goal Progress Aggregation
# Runs every hour to aggregate progress data
resource "aws_cloudwatch_event_rule" "goal_progress_aggregator" {
  name                = "${var.app_name}-goal-progress-aggregator-${var.environment}"
  description         = "Hourly goal progress aggregation"
  schedule_expression = "rate(1 hour)"
  
  tags = local.tags
}

# SNS Topic for Goal Notifications
resource "aws_sns_topic" "goal_notifications" {
  name         = "${var.app_name}-goal-notifications-${var.environment}"
  display_name = "Goal System Notifications"
  
  tags = local.tags
}

resource "aws_sns_topic_subscription" "goal_notifications_sqs" {
  topic_arn = aws_sns_topic.goal_notifications.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.goal_notifications.arn
}

# SQS Queue for Goal Notifications
resource "aws_sqs_queue" "goal_notifications" {
  name                      = "${var.app_name}-goal-notifications-${var.environment}"
  delay_seconds             = 0
  max_message_size          = 262144 # 256 KB
  message_retention_seconds = 345600  # 4 days
  receive_wait_time_seconds = 0
  
  tags = local.tags
}

resource "aws_sqs_queue_policy" "goal_notifications" {
  queue_url = aws_sqs_queue.goal_notifications.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.goal_notifications.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.goal_notifications.arn
          }
        }
      }
    ]
  })
}

# Data sources
data "aws_caller_identity" "current" {}

# CloudWatch Monitoring for Goals Service
# COMMENTED OUT: This monitoring module expects individual Lambda functions
# for each operation (create_goal, get_goal, etc.), but we use a single
# Lambda pattern where all operations are handled by one api-handler function.
# TODO: Update monitoring to work with single Lambda pattern
# module "monitoring" {
#   source = "../../modules/monitoring"
#   
#   app_name     = var.app_name
#   service_name = local.service_name
#   environment  = var.environment
#   aws_region   = var.aws_region
#   
#   # Use existing SNS topic for alarms
#   alarm_actions = [aws_sns_topic.goal_notifications.arn]
#   
#   tags = local.tags
# }

# Outputs for Lambda functions
# REMOVED: Table outputs since we're using the main application table

output "goal_attachments_bucket_name" {
  value       = aws_s3_bucket.goal_attachments.id
  description = "Name of the S3 bucket for goal attachments"
}

output "goal_attachments_bucket_arn" {
  value       = aws_s3_bucket.goal_attachments.arn
  description = "ARN of the S3 bucket for goal attachments"
}

output "goal_notifications_topic_arn" {
  value       = aws_sns_topic.goal_notifications.arn
  description = "ARN of the SNS topic for goal notifications"
}

output "goal_notifications_queue_url" {
  value       = aws_sqs_queue.goal_notifications.id
  description = "URL of the SQS queue for goal notifications"
}

output "goal_notifications_queue_arn" {
  value       = aws_sqs_queue.goal_notifications.arn
  description = "ARN of the SQS queue for goal notifications"
}
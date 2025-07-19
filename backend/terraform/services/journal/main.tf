# Journal Service Infrastructure
# Supports encrypted journaling with templates and goal linking

locals {
  service_name = "journal"
  
  default_tags = {
    Service     = local.service_name
    Module      = "journal"
    Description = "Journal service infrastructure"
  }
  
  tags = merge(local.default_tags, var.tags)
}

# Journal entries are stored in the main DynamoDB table with:
# - PK: USER#<userId>
# - SK: JOURNAL#<entryId>
# - GSI1_PK: USER#<userId>#JOURNAL#<year-month> (for monthly queries)
# - GSI1_SK: <timestamp>

# S3 Bucket for journal attachments (images, files)
resource "aws_s3_bucket" "journal_attachments" {
  bucket = "${var.app_name}-journal-attachments-${var.environment}"
  
  tags = merge(local.tags, {
    Name = "${var.app_name}-journal-attachments-${var.environment}"
  })
}

resource "aws_s3_bucket_versioning" "journal_attachments" {
  bucket = aws_s3_bucket.journal_attachments.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "journal_attachments" {
  bucket = aws_s3_bucket.journal_attachments.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "journal_attachments" {
  bucket = aws_s3_bucket.journal_attachments.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "journal_attachments" {
  bucket = aws_s3_bucket.journal_attachments.id
  
  rule {
    id     = "cleanup-old-attachments"
    status = "Enabled"
    
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
data "aws_iam_policy_document" "journal_attachments_policy" {
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
      "${aws_s3_bucket.journal_attachments.arn}/*"
    ]
    
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_s3_bucket_policy" "journal_attachments" {
  bucket = aws_s3_bucket.journal_attachments.id
  policy = data.aws_iam_policy_document.journal_attachments_policy.json
}

# EventBridge Rule for Journal Stats Aggregation
# Runs daily at 2 AM UTC to aggregate journal statistics
resource "aws_cloudwatch_event_rule" "journal_stats_aggregator" {
  name                = "${var.app_name}-journal-stats-aggregator-${var.environment}"
  description         = "Daily journal statistics aggregation"
  schedule_expression = "cron(0 2 * * ? *)" # 2 AM UTC daily
  
  tags = local.tags
}

# SNS Topic for Journal Notifications (reminders, achievements)
resource "aws_sns_topic" "journal_notifications" {
  name         = "${var.app_name}-journal-notifications-${var.environment}"
  display_name = "Journal Service Notifications"
  
  tags = local.tags
}

# Data sources
data "aws_caller_identity" "current" {}

# Outputs for Lambda functions
output "journal_attachments_bucket_name" {
  value       = aws_s3_bucket.journal_attachments.id
  description = "Name of the S3 bucket for journal attachments"
}

output "journal_attachments_bucket_arn" {
  value       = aws_s3_bucket.journal_attachments.arn
  description = "ARN of the S3 bucket for journal attachments"
}

output "journal_notifications_topic_arn" {
  value       = aws_sns_topic.journal_notifications.arn
  description = "ARN of the SNS topic for journal notifications"
}
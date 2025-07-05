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

# Goals DynamoDB Table
# Single-table design to support all goal patterns
module "goals_table" {
  source = "../../modules/dynamodb"
  
  table_name  = "${var.app_name}-goals"
  environment = var.environment
  
  # Billing configuration
  billing_mode = "PAY_PER_REQUEST" # Start with on-demand
  
  # Primary key design:
  # PK: USER#<userId>
  # SK: GOAL#<goalId> | ACTIVITY#<goalId>#<timestamp>
  hash_key = {
    name = "PK"
    type = "S"
  }
  
  range_key = {
    name = "SK"
    type = "S"
  }
  
  # Additional attributes for indexes
  attributes = [
    {
      name = "GSI1PK"  # For querying by status/category
      type = "S"
    },
    {
      name = "GSI1SK"  # For sorting by created date
      type = "S"
    },
    {
      name = "GSI2PK"  # For querying activities by date
      type = "S"
    },
    {
      name = "GSI2SK"  # For sorting activities
      type = "S"
    },
    {
      name = "TTL"     # For automatic cleanup of old activities
      type = "N"
    }
  ]
  
  # Global Secondary Indexes
  global_secondary_indexes = [
    {
      name            = "GSI1"
      hash_key        = "GSI1PK"
      range_key       = "GSI1SK"
      projection_type = "ALL"
      # Example queries:
      # - All active goals: GSI1PK="STATUS#ACTIVE"
      # - User's goals by category: GSI1PK="USER#<userId>#CATEGORY#<category>"
    },
    {
      name            = "GSI2"
      hash_key        = "GSI2PK"
      range_key       = "GSI2SK"
      projection_type = "ALL"
      # Example queries:
      # - Activities by date: GSI2PK="DATE#2024-01-15"
      # - User activities by date: GSI2PK="USER#<userId>#DATE#2024-01-15"
    }
  ]
  
  # Enable TTL for automatic cleanup
  ttl_attribute = "TTL"
  
  # Enable streams for real-time updates
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  # Enable point-in-time recovery
  point_in_time_recovery = true
  
  # Enable encryption
  server_side_encryption = {
    enabled = true
  }
  
  # Deletion protection for production
  deletion_protection = var.environment == "prod" ? true : false
  
  tags = local.tags
}

# Goal Progress Aggregations Table
# For pre-calculated statistics and trends
module "goal_aggregations_table" {
  source = "../../modules/dynamodb"
  
  table_name  = "${var.app_name}-goal-aggregations"
  environment = var.environment
  
  billing_mode = "PAY_PER_REQUEST"
  
  # PK: USER#<userId>#GOAL#<goalId>
  # SK: PERIOD#<period> (e.g., DAY#2024-01-15, WEEK#2024-W03, MONTH#2024-01)
  hash_key = {
    name = "PK"
    type = "S"
  }
  
  range_key = {
    name = "SK"
    type = "S"
  }
  
  attributes = [
    {
      name = "GSI1PK"
      type = "S"
    },
    {
      name = "GSI1SK"
      type = "S"
    }
  ]
  
  global_secondary_indexes = [
    {
      name            = "GSI1"
      hash_key        = "GSI1PK"
      range_key       = "GSI1SK"
      projection_type = "ALL"
      # For cross-goal analytics
      # GSI1PK="USER#<userId>#PERIOD#DAY#2024-01-15"
    }
  ]
  
  # Short TTL for aggregations (90 days)
  ttl_attribute = "TTL"
  
  # Enable point-in-time recovery
  point_in_time_recovery = true
  
  tags = local.tags
}

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
module "monitoring" {
  source = "../../modules/monitoring"
  
  app_name     = var.app_name
  service_name = local.service_name
  environment  = var.environment
  aws_region   = var.aws_region
  
  # Use existing SNS topic for alarms
  alarm_actions = [aws_sns_topic.goal_notifications.arn]
  
  tags = local.tags
}

# Outputs for Lambda functions
output "goals_table_name" {
  value       = module.goals_table.table_name
  description = "Name of the goals DynamoDB table"
}

output "goals_table_arn" {
  value       = module.goals_table.table_arn
  description = "ARN of the goals DynamoDB table"
}

output "goal_aggregations_table_name" {
  value       = module.goal_aggregations_table.table_name
  description = "Name of the goal aggregations DynamoDB table"
}

output "goal_aggregations_table_arn" {
  value       = module.goal_aggregations_table.table_arn
  description = "ARN of the goal aggregations DynamoDB table"
}

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
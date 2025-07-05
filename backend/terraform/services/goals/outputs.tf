# Table Outputs
output "tables" {
  description = "DynamoDB table information"
  value = {
    goals_table = {
      name = module.goals_table.table_name
      arn  = module.goals_table.table_arn
    }
    aggregations_table = {
      name = module.goal_aggregations_table.table_name
      arn  = module.goal_aggregations_table.table_arn
    }
  }
}

# Storage Outputs
output "storage" {
  description = "S3 bucket information"
  value = {
    attachments_bucket = {
      name = aws_s3_bucket.goal_attachments.id
      arn  = aws_s3_bucket.goal_attachments.arn
    }
  }
}

# Messaging Outputs
output "messaging" {
  description = "SNS/SQS messaging resources"
  value = {
    notifications_topic = {
      arn = aws_sns_topic.goal_notifications.arn
    }
    notifications_queue = {
      url = aws_sqs_queue.goal_notifications.id
      arn = aws_sqs_queue.goal_notifications.arn
    }
  }
}

# Event Rules Outputs
output "event_rules" {
  description = "EventBridge rule information"
  value = {
    streak_processor = {
      name = aws_cloudwatch_event_rule.goal_streak_processor.name
      arn  = aws_cloudwatch_event_rule.goal_streak_processor.arn
    }
    progress_aggregator = {
      name = aws_cloudwatch_event_rule.goal_progress_aggregator.name
      arn  = aws_cloudwatch_event_rule.goal_progress_aggregator.arn
    }
  }
}

# Consolidated output for Lambda environment variables
output "lambda_environment" {
  description = "Environment variables for Lambda functions"
  value = {
    GOALS_TABLE_NAME             = module.goals_table.table_name
    GOAL_AGGREGATIONS_TABLE_NAME = module.goal_aggregations_table.table_name
    GOAL_ATTACHMENTS_BUCKET      = aws_s3_bucket.goal_attachments.id
    GOAL_NOTIFICATIONS_TOPIC_ARN = aws_sns_topic.goal_notifications.arn
    GOAL_NOTIFICATIONS_QUEUE_URL = aws_sqs_queue.goal_notifications.id
  }
}
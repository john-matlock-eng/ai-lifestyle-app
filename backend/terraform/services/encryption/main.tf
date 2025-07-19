# Encryption Service Infrastructure
# Supports zero-knowledge encryption with key management and sharing

locals {
  service_name = "encryption"
  
  default_tags = {
    Service     = local.service_name
    Module      = "encryption"
    Description = "Encryption service infrastructure"
  }
  
  tags = merge(local.default_tags, var.tags)
}

# Encryption data is stored in the main DynamoDB table with:
# - PK: USER#<userId>
# - SK: ENCRYPTION#KEYS
# For shares:
# - PK: USER#<recipientId>
# - SK: SHARE#<shareId>
# - GSI1_PK: USER#<ownerId>
# - GSI1_SK: SHARE#CREATED#<shareId>

# Parameter Store for AI Service Keys
resource "aws_ssm_parameter" "ai_service_private_key" {
  name        = "/ai-lifestyle-app/ai-service/private-key"
  description = "AI service private key for decrypting shared content"
  type        = "SecureString"
  value       = "placeholder-will-be-generated" # In production, generate a real key
  
  tags = merge(local.tags, {
    Name = "AI Service Private Key"
  })
  
  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "ai_service_public_key" {
  name        = "/ai-lifestyle-app/ai-service/public-key"
  description = "AI service public key for encryption"
  type        = "String"
  value       = "placeholder-will-be-generated" # In production, generate a real key
  
  tags = merge(local.tags, {
    Name = "AI Service Public Key"
  })
  
  lifecycle {
    ignore_changes = [value]
  }
}

# SQS Queue for AI Analysis Requests
resource "aws_sqs_queue" "ai_analysis_requests" {
  name                       = "${var.app_name}-ai-analysis-requests-${var.environment}"
  delay_seconds              = 0
  max_message_size           = 262144  # 256 KB
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 20      # Long polling
  visibility_timeout_seconds = 300     # 5 minutes
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ai_analysis_dlq.arn
    maxReceiveCount     = 3
  })
  
  tags = merge(local.tags, {
    Name = "${var.app_name}-ai-analysis-requests-${var.environment}"
  })
}

# Dead Letter Queue for AI Analysis
resource "aws_sqs_queue" "ai_analysis_dlq" {
  name                      = "${var.app_name}-ai-analysis-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days
  
  tags = merge(local.tags, {
    Name = "${var.app_name}-ai-analysis-dlq-${var.environment}"
  })
}

# CloudWatch Log Group for Encryption Service
resource "aws_cloudwatch_log_group" "encryption_service" {
  name              = "/aws/lambda/${var.app_name}-encryption-${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = local.tags
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "failed_share_creations" {
  alarm_name          = "${var.app_name}-encryption-failed-shares-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ShareCreationFailures"
  namespace           = "AILifestyleApp"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Triggered when share creation failures exceed threshold"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    Environment = var.environment
  }
  
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "ai_analysis_queue_depth" {
  alarm_name          = "${var.app_name}-ai-analysis-queue-depth-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "100"
  alarm_description   = "Triggered when AI analysis queue backs up"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    QueueName = aws_sqs_queue.ai_analysis_requests.name
  }
  
  tags = local.tags
}

# Outputs for Lambda functions
output "ai_service_public_key_parameter" {
  value       = aws_ssm_parameter.ai_service_public_key.name
  description = "Parameter name for AI service public key"
}

output "ai_service_private_key_parameter" {
  value       = aws_ssm_parameter.ai_service_private_key.name
  description = "Parameter name for AI service private key"
}

output "ai_analysis_queue_url" {
  value       = aws_sqs_queue.ai_analysis_requests.url
  description = "URL of the AI analysis request queue"
}

output "ai_analysis_queue_arn" {
  value       = aws_sqs_queue.ai_analysis_requests.arn
  description = "ARN of the AI analysis request queue"
}

output "encryption_log_group_name" {
  value       = aws_cloudwatch_log_group.encryption_service.name
  description = "CloudWatch log group for encryption service"
}

# CloudWatch Monitoring Module
# Provides comprehensive monitoring for the AI Lifestyle App

locals {
  dashboard_name = "${var.app_name}-${var.service_name}-${var.environment}"
  
  # Goal endpoint function names
  goal_functions = [
    "create_goal",
    "get_goal",
    "list_goals",
    "update_goal",
    "archive_goal",
    "log_activity",
    "list_activities",
    "get_progress"
  ]
  
  # Critical latency thresholds (ms)
  latency_thresholds = {
    p50_threshold = 50
    p95_threshold = 100
    p99_threshold = 200
  }
  
  default_tags = {
    Module      = "monitoring"
    Service     = var.service_name
    Environment = var.environment
  }
  
  tags = merge(local.default_tags, var.tags)
}

# CloudWatch Dashboard for Goal System
resource "aws_cloudwatch_dashboard" "goals" {
  dashboard_name = local.dashboard_name
  
  dashboard_body = jsonencode({
    widgets = concat(
      # Summary Statistics Row
      [
        {
          type   = "metric"
          x      = 0
          y      = 0
          width  = 8
          height = 6
          
          properties = {
            metrics = [
              for fn in local.goal_functions : [
                "AWS/Lambda",
                "Invocations",
                "FunctionName",
                "${fn}-${var.environment}",
                { stat = "Sum", label = fn }
              ]
            ]
            period = 300
            stat   = "Sum"
            region = var.aws_region
            title  = "API Invocations (5 min)"
            view   = "timeSeries"
            yAxis = {
              left = {
                showUnits = false
              }
            }
          }
        },
        {
          type   = "metric"
          x      = 8
          y      = 0
          width  = 8
          height = 6
          
          properties = {
            metrics = [
              for fn in local.goal_functions : [
                "AWS/Lambda",
                "Errors",
                "FunctionName",
                "${fn}-${var.environment}",
                { stat = "Sum", label = fn }
              ]
            ]
            period = 300
            stat   = "Sum"
            region = var.aws_region
            title  = "API Errors (5 min)"
            view   = "timeSeries"
            yAxis = {
              left = {
                showUnits = false
              }
            }
          }
        },
        {
          type   = "metric"
          x      = 16
          y      = 0
          width  = 8
          height = 6
          
          properties = {
            metrics = [
              [ "AWS/Lambda", "ConcurrentExecutions", { stat = "Maximum" } ],
              [ ".", "UnreservedConcurrentExecutions", { stat = "Maximum" } ]
            ]
            period = 300
            stat   = "Maximum"
            region = var.aws_region
            title  = "Concurrent Executions"
            view   = "timeSeries"
            yAxis = {
              left = {
                showUnits = false
              }
            }
          }
        }
      ],
      
      # Latency Metrics Row
      [
        {
          type   = "metric"
          x      = 0
          y      = 6
          width  = 8
          height = 6
          
          properties = {
            metrics = [
              for fn in local.goal_functions : [
                "AWS/Lambda",
                "Duration",
                "FunctionName",
                "${fn}-${var.environment}",
                { stat = "p50", label = "${fn} p50" }
              ]
            ]
            period = 300
            stat   = "p50"
            region = var.aws_region
            title  = "API Latency p50 (ms)"
            view   = "timeSeries"
            yAxis = {
              left = {
                showUnits = false
              }
            }
            annotations = {
              horizontal = [
                {
                  label = "Target p50"
                  value = local.latency_thresholds.p50_threshold
                }
              ]
            }
          }
        },
        {
          type   = "metric"
          x      = 8
          y      = 6
          width  = 8
          height = 6
          
          properties = {
            metrics = [
              for fn in local.goal_functions : [
                "AWS/Lambda",
                "Duration",
                "FunctionName",
                "${fn}-${var.environment}",
                { stat = "p95", label = "${fn} p95" }
              ]
            ]
            period = 300
            stat   = "p95"
            region = var.aws_region
            title  = "API Latency p95 (ms)"
            view   = "timeSeries"
            yAxis = {
              left = {
                showUnits = false
              }
            }
            annotations = {
              horizontal = [
                {
                  label = "Target p95"
                  value = local.latency_thresholds.p95_threshold
                }
              ]
            }
          }
        },
        {
          type   = "metric"
          x      = 16
          y      = 6
          width  = 8
          height = 6
          
          properties = {
            metrics = [
              for fn in local.goal_functions : [
                "AWS/Lambda",
                "Duration",
                "FunctionName",
                "${fn}-${var.environment}",
                { stat = "p99", label = "${fn} p99" }
              ]
            ]
            period = 300
            stat   = "p99"
            region = var.aws_region
            title  = "API Latency p99 (ms)"
            view   = "timeSeries"
            yAxis = {
              left = {
                showUnits = false
              }
            }
            annotations = {
              horizontal = [
                {
                  label = "Target p99"
                  value = local.latency_thresholds.p99_threshold
                }
              ]
            }
          }
        }
      ],
      
      # DynamoDB Metrics Row
      [
        {
          type   = "metric"
          x      = 0
          y      = 12
          width  = 12
          height = 6
          
          properties = {
            metrics = [
              [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${var.app_name}-goals-${var.environment}", { stat = "Sum" } ],
              [ ".", "ConsumedWriteCapacityUnits", ".", ".", { stat = "Sum" } ]
            ]
            period = 300
            stat   = "Sum"
            region = var.aws_region
            title  = "DynamoDB Consumed Capacity"
            view   = "timeSeries"
            yAxis = {
              left = {
                showUnits = false
              }
            }
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 12
          width  = 12
          height = 6
          
          properties = {
            metrics = [
              [ "AWS/DynamoDB", "UserErrors", "TableName", "${var.app_name}-goals-${var.environment}", { stat = "Sum" } ],
              [ ".", "SystemErrors", ".", ".", { stat = "Sum" } ]
            ]
            period = 300
            stat   = "Sum"
            region = var.aws_region
            title  = "DynamoDB Errors"
            view   = "timeSeries"
            yAxis = {
              left = {
                showUnits = false
              }
            }
          }
        }
      ],
      
      # Goal Pattern Distribution
      [
        {
          type   = "log"
          x      = 0
          y      = 18
          width  = 12
          height = 6
          
          properties = {
            query  = <<-EOT
              SOURCE '/aws/lambda/create_goal-${var.environment}'
              | fields @timestamp, goalPattern
              | filter @message like /Created goal/
              | stats count() by goalPattern
            EOT
            region = var.aws_region
            title  = "Goal Pattern Distribution"
            view   = "pie"
          }
        },
        {
          type   = "log"
          x      = 12
          y      = 18
          width  = 12
          height = 6
          
          properties = {
            query  = <<-EOT
              SOURCE '/aws/lambda/log_activity-${var.environment}'
              | fields @timestamp, @message
              | filter @message like /Activity logged/
              | stats count() by bin(5m)
            EOT
            region = var.aws_region
            title  = "Activity Logging Rate"
            view   = "timeSeries"
          }
        }
      ],
      
      # Error Analysis
      [
        {
          type   = "log"
          x      = 0
          y      = 24
          width  = 24
          height = 6
          
          properties = {
            query  = <<-EOT
              SOURCE '/aws/lambda/*-${var.environment}'
              | fields @timestamp, @message, @log
              | filter @message like /ERROR/
              | sort @timestamp desc
              | limit 50
            EOT
            region = var.aws_region
            title  = "Recent Errors (All Functions)"
            view   = "table"
          }
        }
      ]
    )
  })
}

# CloudWatch Alarms for each goal function
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  for_each = toset(local.goal_functions)
  
  alarm_name          = "${each.key}-${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors error rate for ${each.key}"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = "${each.key}-${var.environment}"
  }
  
  alarm_actions = var.alarm_actions
  
  tags = merge(local.tags, {
    Function = each.key
  })
}

resource "aws_cloudwatch_metric_alarm" "high_latency_p99" {
  for_each = toset(local.goal_functions)
  
  alarm_name          = "${each.key}-${var.environment}-high-latency-p99"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  extended_statistic  = "p99"
  threshold           = local.latency_thresholds.p99_threshold
  alarm_description   = "This metric monitors p99 latency for ${each.key}"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = "${each.key}-${var.environment}"
  }
  
  alarm_actions = var.alarm_actions
  
  tags = merge(local.tags, {
    Function = each.key
  })
}

# DynamoDB Alarms
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.app_name}-goals-${var.environment}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "DynamoDB throttling errors"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    TableName = "${var.app_name}-goals-${var.environment}"
  }
  
  alarm_actions = var.alarm_actions
  
  tags = local.tags
}

# Composite Alarms for service health
resource "aws_cloudwatch_composite_alarm" "goals_service_degraded" {
  alarm_name          = "${var.app_name}-goals-${var.environment}-service-degraded"
  alarm_description   = "Goals service is experiencing degraded performance"
  
  alarm_rule = join(" OR ", [
    for fn in local.goal_functions : "ALARM('${aws_cloudwatch_metric_alarm.high_error_rate[fn].alarm_name}')"
  ])
  
  alarm_actions = var.alarm_actions
  
  tags = local.tags
}

# Custom Metrics for Business KPIs
resource "aws_cloudwatch_log_metric_filter" "goals_created" {
  name           = "${var.app_name}-goals-created-${var.environment}"
  log_group_name = "/aws/lambda/create_goal-${var.environment}"
  pattern        = "[timestamp, request_id, level=INFO, msg=\"Created goal*\"]"
  
  metric_transformation {
    name      = "GoalsCreated"
    namespace = "${var.app_name}/Goals"
    value     = "1"
    
    dimensions = {
      Environment = var.environment
    }
  }
}

resource "aws_cloudwatch_log_metric_filter" "activities_logged" {
  name           = "${var.app_name}-activities-logged-${var.environment}"
  log_group_name = "/aws/lambda/log_activity-${var.environment}"
  pattern        = "[timestamp, request_id, level=INFO, msg=\"Activity logged*\"]"
  
  metric_transformation {
    name      = "ActivitiesLogged"
    namespace = "${var.app_name}/Goals"
    value     = "1"
    
    dimensions = {
      Environment = var.environment
    }
  }
}

# SNS Topic for Alarms (if not provided)
resource "aws_sns_topic" "alarms" {
  count        = length(var.alarm_actions) == 0 ? 1 : 0
  name         = "${var.app_name}-${var.service_name}-alarms-${var.environment}"
  display_name = "Alarms for ${var.service_name} service"
  
  tags = local.tags
}

# Outputs
output "dashboard_url" {
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.goals.dashboard_name}"
  description = "URL to the CloudWatch dashboard"
}

output "alarm_topic_arn" {
  value       = length(var.alarm_actions) == 0 ? aws_sns_topic.alarms[0].arn : var.alarm_actions[0]
  description = "SNS topic ARN for alarms"
}

output "metric_filters" {
  value = {
    goals_created    = aws_cloudwatch_log_metric_filter.goals_created.name
    activities_logged = aws_cloudwatch_log_metric_filter.activities_logged.name
  }
  description = "Names of custom metric filters"
}
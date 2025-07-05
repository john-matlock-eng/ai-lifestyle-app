# Monitoring Module Outputs

output "dashboard_name" {
  value       = aws_cloudwatch_dashboard.goals.dashboard_name
  description = "Name of the CloudWatch dashboard"
}

output "alarms" {
  value = {
    error_rate = {
      for k, v in aws_cloudwatch_metric_alarm.high_error_rate : k => v.arn
    }
    latency = {
      for k, v in aws_cloudwatch_metric_alarm.high_latency_p99 : k => v.arn
    }
    dynamodb    = aws_cloudwatch_metric_alarm.dynamodb_throttles.arn
    composite   = aws_cloudwatch_composite_alarm.goals_service_degraded.arn
  }
  description = "ARNs of all created alarms"
}

output "custom_metrics" {
  value = {
    namespace = "${var.app_name}/Goals"
    metrics = {
      goals_created     = "GoalsCreated"
      activities_logged = "ActivitiesLogged"
    }
  }
  description = "Custom CloudWatch metrics"
}
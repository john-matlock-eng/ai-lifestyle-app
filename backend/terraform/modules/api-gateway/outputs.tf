output "api_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  description = "Default endpoint URL of the API"
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "invoke_url" {
  description = "Invoke URL for the API stage"
  value       = aws_apigatewayv2_stage.this.invoke_url
}

output "execution_arn" {
  description = "Execution ARN of the API"
  value       = aws_apigatewayv2_api.this.execution_arn
}

output "stage_id" {
  description = "ID of the deployment stage"
  value       = aws_apigatewayv2_stage.this.id
}

output "stage_arn" {
  description = "ARN of the deployment stage"
  value       = aws_apigatewayv2_stage.this.arn
}

output "custom_domain_name" {
  description = "Custom domain name (if configured)"
  value       = var.custom_domain != null ? aws_apigatewayv2_domain_name.this[0].domain_name : null
}

output "custom_domain_hosted_zone_id" {
  description = "Route 53 hosted zone ID for custom domain"
  value       = var.custom_domain != null ? aws_apigatewayv2_domain_name.this[0].domain_name_configuration[0].hosted_zone_id : null
}

output "custom_domain_target_domain_name" {
  description = "Target domain name for custom domain DNS"
  value       = var.custom_domain != null ? aws_apigatewayv2_domain_name.this[0].domain_name_configuration[0].target_domain_name : null
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.api.name
}

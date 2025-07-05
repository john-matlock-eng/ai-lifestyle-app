output "api_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  description = "Default endpoint URL of the API Gateway"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "api_arn" {
  description = "ARN of the API Gateway"
  value       = aws_apigatewayv2_api.this.arn
}

output "execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_apigatewayv2_api.this.execution_arn
}

output "stage_id" {
  description = "ID of the default stage"
  value       = aws_apigatewayv2_stage.default.id
}

output "stage_name" {
  description = "Name of the default stage"
  value       = aws_apigatewayv2_stage.default.name
}

output "custom_domain_name" {
  description = "Custom domain name if configured"
  value       = var.custom_domain_name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for API Gateway logs"
  value       = aws_cloudwatch_log_group.api_logs.name
}

output "authorizer_id" {
  description = "ID of the JWT authorizer if enabled"
  value       = var.enable_jwt_authorizer ? aws_apigatewayv2_authorizer.jwt[0].id : null
}

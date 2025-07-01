output "lambda_function_arns" {
  description = "ARNs of the Lambda functions"
  value = {
    for k, v in module.lambda_functions : k => v.lambda_function_arn
  }
}

output "lambda_function_names" {
  description = "Names of the Lambda functions"
  value = {
    for k, v in module.lambda_functions : k => v.lambda_function_name
  }
}

output "ecr_repository_urls" {
  description = "URLs of the ECR repositories"
  value = {
    for k, v in module.ecr_repositories : k => v.repository_url
  }
}

output "api_gateway_integrations" {
  description = "API Gateway integration IDs"
  value = {
    for k, v in aws_apigatewayv2_integration.auth_lambdas : k => v.id
  }
}

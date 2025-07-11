output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_url" {
  description = "Frontend URL"
  value       = var.create_custom_domain ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.frontend.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "environment_config" {
  description = "Environment configuration for the frontend"
  value = {
    VITE_API_URL                = var.api_url
    VITE_APP_NAME              = "${var.project_name} - ${var.environment}"
    VITE_COGNITO_REGION        = var.aws_region
    VITE_COGNITO_USER_POOL_ID  = var.cognito_user_pool_id
    VITE_COGNITO_CLIENT_ID     = var.cognito_client_id
    VITE_ENVIRONMENT           = var.environment
  }
  sensitive = true
}

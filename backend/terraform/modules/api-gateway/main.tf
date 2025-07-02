locals {
  api_name = "${var.api_name}-${var.environment}"
  
  default_tags = {
    Module      = "api-gateway"
    API         = var.api_name
    Environment = var.environment
  }
  
  tags = merge(local.default_tags, var.tags)
}

# HTTP API Gateway
resource "aws_apigatewayv2_api" "this" {
  name          = local.api_name
  protocol_type = "HTTP"
  description   = var.description

  cors_configuration {
    allow_origins     = var.cors_origins
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers     = ["*"]
    expose_headers    = ["*"]
    max_age           = 86400
    allow_credentials = true
  }

  tags = local.tags
}

# Default stage with auto-deploy
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      error          = "$context.error.message"
    })
  }

  default_route_settings {
    detailed_metrics_enabled = true
    throttling_rate_limit    = var.throttle_rate_limit
    throttling_burst_limit   = var.throttle_burst_limit
  }

  tags = local.tags
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/api-gateway/${local.api_name}"
  retention_in_days = var.log_retention_days
  tags              = local.tags
}

# Lambda integration
resource "aws_apigatewayv2_integration" "lambda" {
  count = var.lambda_function_name != "" ? 1 : 0
  
  api_id = aws_apigatewayv2_api.this.id

  integration_type       = "AWS_PROXY"
  integration_uri        = var.lambda_invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 29000
}

# Routes with Lambda integration
resource "aws_apigatewayv2_route" "routes" {
  for_each = var.lambda_function_name != "" ? var.routes : {}

  api_id    = aws_apigatewayv2_api.this.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.lambda[0].id}"

  # Add authorizer if specified
  authorization_type = lookup(each.value, "authorization_type", "NONE")
  authorizer_id      = lookup(each.value, "authorization_type", "NONE") != "NONE" && var.enable_jwt_authorizer ? aws_apigatewayv2_authorizer.jwt[0].id : null
}

# JWT Authorizer (optional)
resource "aws_apigatewayv2_authorizer" "jwt" {
  count = var.enable_jwt_authorizer ? 1 : 0

  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${local.api_name}-jwt-authorizer"

  jwt_configuration {
    audience = var.jwt_audience
    issuer   = var.jwt_issuer
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  count = var.lambda_function_name != "" ? 1 : 0
  
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

# Custom domain (optional)
resource "aws_apigatewayv2_domain_name" "this" {
  count = var.custom_domain_name != null ? 1 : 0

  domain_name = var.custom_domain_name

  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = local.tags
}

# API mapping for custom domain
resource "aws_apigatewayv2_api_mapping" "this" {
  count = var.custom_domain_name != null ? 1 : 0

  api_id      = aws_apigatewayv2_api.this.id
  domain_name = aws_apigatewayv2_domain_name.this[0].id
  stage       = aws_apigatewayv2_stage.default.id
}

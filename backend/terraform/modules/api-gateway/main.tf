locals {
  api_name = "${var.api_name}-${var.environment}"
  
  default_tags = {
    Module      = "api-gateway"
    API         = var.api_name
    Environment = var.environment
  }
  
  tags = merge(local.default_tags, var.tags)
  
  # Default access log format
  default_log_format = jsonencode({
    requestId      = "$context.requestId"
    ip             = "$context.identity.sourceIp"
    caller         = "$context.identity.caller"
    user           = "$context.identity.user"
    requestTime    = "$context.requestTime"
    httpMethod     = "$context.httpMethod"
    resourcePath   = "$context.resourcePath"
    status         = "$context.status"
    protocol       = "$context.protocol"
    responseLength = "$context.responseLength"
    error          = "$context.error.message"
    integrationError = "$context.integrationErrorMessage"
  })
}

# API Gateway
resource "aws_apigatewayv2_api" "this" {
  name                       = local.api_name
  description                = coalesce(var.description, "API Gateway for ${var.api_name}")
  protocol_type              = "HTTP"
  api_key_selection_expression = "$request.header.x-api-key"
  
  cors_configuration {
    allow_origins     = var.cors_configuration.allow_origins
    allow_methods     = var.cors_configuration.allow_methods
    allow_headers     = var.cors_configuration.allow_headers
    expose_headers    = var.cors_configuration.expose_headers
    max_age          = var.cors_configuration.max_age
    allow_credentials = var.cors_configuration.allow_credentials
  }

  tags = local.tags
}

# Lambda integrations
resource "aws_apigatewayv2_integration" "lambda" {
  for_each = var.routes

  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = each.value.lambda_invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
  timeout_milliseconds   = 29000  # Max timeout

  lifecycle {
    create_before_destroy = true
  }
}

# Routes
resource "aws_apigatewayv2_route" "this" {
  for_each = var.routes

  api_id    = aws_apigatewayv2_api.this.id
  route_key = "${each.value.method} ${each.key}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda[each.key].id}"
  
  authorization_type = each.value.authorization_type
  authorizer_id      = each.value.authorizer_id
  api_key_required   = each.value.api_key_required
  
  dynamic "request_parameter" {
    for_each = each.value.request_parameters
    content {
      location        = request_parameter.key
      required        = request_parameter.value == "true" ? true : false
    }
  }
}

# CloudWatch Log Group for access logs
resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/apigateway/${local.api_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = local.tags
}

# Deployment
resource "aws_apigatewayv2_deployment" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  description = "Deployment for ${local.api_name}"

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_apigatewayv2_route.this,
    aws_apigatewayv2_integration.lambda
  ]
}

# Stage
resource "aws_apigatewayv2_stage" "this" {
  api_id        = aws_apigatewayv2_api.this.id
  name          = var.stage_name
  deployment_id = aws_apigatewayv2_deployment.this.id
  
  default_route_settings {
    throttle_burst_limit = var.throttle_settings.burst_limit
    throttle_rate_limit  = var.throttle_settings.rate_limit
    
    detailed_metrics_enabled = var.environment == "prod" ? true : false
    logging_level           = var.environment == "prod" ? "ERROR" : "INFO"
  }
  
  dynamic "access_log_settings" {
    for_each = var.access_log_settings != null ? [1] : []
    content {
      destination_arn = coalesce(var.access_log_settings.destination_arn, aws_cloudwatch_log_group.api.arn)
      format         = coalesce(var.access_log_settings.format, local.default_log_format)
    }
  }

  dynamic "route_settings" {
    for_each = { 
      for k, v in var.routes : k => v 
      if v.throttle_burst_limit != null || v.throttle_rate_limit != null 
    }
    content {
      route_key            = "${route_settings.value.method} ${route_settings.key}"
      throttle_burst_limit = route_settings.value.throttle_burst_limit
      throttle_rate_limit  = route_settings.value.throttle_rate_limit
    }
  }

  tags = local.tags
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = var.routes

  statement_id  = "AllowAPIGateway-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

# Custom domain mapping (optional)
resource "aws_apigatewayv2_domain_name" "this" {
  count = var.custom_domain != null ? 1 : 0

  domain_name = var.custom_domain.domain_name
  
  domain_name_configuration {
    certificate_arn = var.custom_domain.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = local.tags
}

resource "aws_apigatewayv2_api_mapping" "this" {
  count = var.custom_domain != null ? 1 : 0

  api_id          = aws_apigatewayv2_api.this.id
  domain_name     = aws_apigatewayv2_domain_name.this[0].domain_name
  stage           = aws_apigatewayv2_stage.this.id
  api_mapping_key = var.custom_domain.base_path
}

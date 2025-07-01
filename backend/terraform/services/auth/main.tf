# Auth Service Infrastructure

locals {
  service_name = "auth"
  
  # Lambda function configurations
  lambda_functions = {
    register_user = {
      handler     = "handler.lambda_handler"
      memory_size = 512
      timeout     = 30
      description = "User registration endpoint"
    }
    login_user = {
      handler     = "handler.lambda_handler"
      memory_size = 512
      timeout     = 30
      description = "User login endpoint"
    }
    refresh_token = {
      handler     = "handler.lambda_handler"
      memory_size = 256
      timeout     = 10
      description = "Token refresh endpoint"
    }
    get_user_profile = {
      handler     = "handler.lambda_handler"
      memory_size = 256
      timeout     = 10
      description = "Get user profile endpoint"
    }
    update_user_profile = {
      handler     = "handler.lambda_handler"
      memory_size = 256
      timeout     = 10
      description = "Update user profile endpoint"
    }
  }
}

# Create ECR repositories for each Lambda function
module "ecr_repositories" {
  source = "../../modules/ecr"
  
  for_each = local.lambda_functions
  
  repository_name = "${var.project}-${local.service_name}-${replace(each.key, "_", "-")}"
  environment     = var.environment
  tags           = var.tags
}

# Create Lambda functions
module "lambda_functions" {
  source = "../../modules/lambda-ecr"
  
  for_each = local.lambda_functions
  
  function_name = "${var.project}-${local.service_name}-${replace(each.key, "_", "-")}-${var.environment}"
  description   = each.value.description
  
  # Container image
  image_uri = "${module.ecr_repositories[each.key].repository_url}:latest"
  
  # Configuration
  handler     = each.value.handler
  memory_size = each.value.memory_size
  timeout     = each.value.timeout
  
  # Environment variables
  environment_variables = {
    ENVIRONMENT             = var.environment
    LOG_LEVEL              = var.log_level
    COGNITO_USER_POOL_ID   = var.cognito_user_pool_id
    COGNITO_CLIENT_ID      = var.cognito_client_id
    USERS_TABLE_NAME       = var.users_table_name
    CORS_ORIGIN           = var.cors_origin
  }
  
  # IAM permissions
  attach_policy_statements = true
  policy_statements = [
    {
      effect = "Allow"
      actions = [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminSetUserPassword",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:AdminUserGlobalSignOut",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:AdminInitiateAuth",
        "cognito-idp:AdminRespondToAuthChallenge"
      ]
      resources = [var.cognito_user_pool_arn]
    },
    {
      effect = "Allow"
      actions = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ]
      resources = [
        var.users_table_arn,
        "${var.users_table_arn}/index/*"
      ]
    }
  ]
  
  # X-Ray tracing
  tracing_config_mode = "Active"
  
  # CloudWatch Logs
  cloudwatch_logs_retention_in_days = var.log_retention_days
  
  tags = merge(var.tags, {
    Service = local.service_name
    Function = each.key
  })
}

# API Gateway integrations
resource "aws_apigatewayv2_integration" "auth_lambdas" {
  for_each = local.lambda_functions
  
  api_id = var.api_gateway_id
  
  integration_type       = "AWS_PROXY"
  integration_uri        = module.lambda_functions[each.key].lambda_function_invoke_arn
  payload_format_version = "2.0"
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = local.lambda_functions
  
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_functions[each.key].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}

# CloudWatch alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = local.lambda_functions
  
  alarm_name          = "${module.lambda_functions[each.key].lambda_function_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "60"
  statistic          = "Sum"
  threshold          = "10"
  alarm_description  = "This metric monitors lambda errors"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    FunctionName = module.lambda_functions[each.key].lambda_function_name
  }
  
  alarm_actions = var.alarm_topic_arn != "" ? [var.alarm_topic_arn] : []
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = local.lambda_functions
  
  alarm_name          = "${module.lambda_functions[each.key].lambda_function_name}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Throttles"
  namespace          = "AWS/Lambda"
  period             = "60"
  statistic          = "Sum"
  threshold          = "5"
  alarm_description  = "This metric monitors lambda throttles"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    FunctionName = module.lambda_functions[each.key].lambda_function_name
  }
  
  alarm_actions = var.alarm_topic_arn != "" ? [var.alarm_topic_arn] : []
  
  tags = var.tags
}

locals {
  function_name = "${var.function_name}-${var.environment}"
  
  default_tags = {
    Module      = "lambda-ecr"
    Function    = var.function_name
    Environment = var.environment
  }
  
  tags = merge(local.default_tags, var.tags)
}

# Lambda execution role
resource "aws_iam_role" "lambda" {
  name = "${local.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.tags
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda.name
}

# VPC access policy (if VPC config provided)
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  count      = var.vpc_config != null ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role       = aws_iam_role.lambda.name
}

# X-Ray tracing policy
resource "aws_iam_role_policy_attachment" "lambda_xray" {
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
  role       = aws_iam_role.lambda.name
}

# Additional policy attachments
resource "aws_iam_role_policy_attachment" "additional" {
  for_each   = toset(var.additional_policies)
  policy_arn = each.value
  role       = aws_iam_role.lambda.name
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = var.log_retention_days
  tags              = local.tags
}

# Lambda function
resource "aws_lambda_function" "this" {
  function_name = local.function_name
  role          = aws_iam_role.lambda.arn

  package_type = "Image"
  image_uri    = var.ecr_image_uri
  
  memory_size = var.memory_size
  timeout     = var.timeout
  
  architectures = ["arm64"]  # ARM architecture for cost savings
  
  reserved_concurrent_executions = var.reserved_concurrent_executions

  environment {
    variables = merge(
      {
        ENVIRONMENT = var.environment
        LOG_LEVEL   = var.environment == "prod" ? "INFO" : "DEBUG"
      },
      var.environment_variables
    )
  }

  dynamic "vpc_config" {
    for_each = var.vpc_config != null ? [var.vpc_config] : []
    content {
      subnet_ids         = vpc_config.value.subnet_ids
      security_group_ids = vpc_config.value.security_group_ids
    }
  }

  tracing_config {
    mode = var.tracing_mode
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
    aws_cloudwatch_log_group.lambda,
  ]

  tags = local.tags
}

# Lambda alias for stable endpoint
resource "aws_lambda_alias" "live" {
  name             = "live"
  description      = "Live alias for ${local.function_name}"
  function_name    = aws_lambda_function.this.function_name
  function_version = "$LATEST"
}

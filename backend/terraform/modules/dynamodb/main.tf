locals {
  table_name = "${var.table_name}-${var.environment}"
  
  default_tags = {
    Module      = "dynamodb"
    Table       = var.table_name
    Environment = var.environment
  }
  
  tags = merge(local.default_tags, var.tags)
  
  # Collect all attributes from keys and indexes
  all_attributes = concat(
    [var.hash_key],
    var.range_key != null ? [var.range_key] : [],
    var.attributes,
    var.additional_attributes,
    [for idx in var.global_secondary_indexes : { name = idx.hash_key, type = "" }],
    [for idx in var.global_secondary_indexes : { name = idx.range_key, type = "" } if idx.range_key != null],
    [for idx in var.local_secondary_indexes : { name = idx.range_key, type = "" }]
  )
  
  # Deduplicate attributes
  unique_attributes = {
    for attr in local.all_attributes : attr.name => attr
    if attr.type != ""
  }
}

# DynamoDB Table
resource "aws_dynamodb_table" "this" {
  name         = local.table_name
  billing_mode = var.billing_mode
  
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
  
  hash_key  = var.hash_key.name
  range_key = var.range_key != null ? var.range_key.name : null
  
  deletion_protection_enabled = var.deletion_protection
  
  # Define all attributes used in keys and indexes
  dynamic "attribute" {
    for_each = local.unique_attributes
    content {
      name = attribute.key
      type = attribute.value.type
    }
  }
  
  # TTL configuration
  dynamic "ttl" {
    for_each = var.ttl_attribute != "" ? [1] : []
    content {
      attribute_name = var.ttl_attribute
      enabled        = true
    }
  }
  
  # Stream configuration
  stream_enabled   = var.stream_enabled
  stream_view_type = var.stream_enabled ? var.stream_view_type : null
  
  # Point-in-time recovery
  point_in_time_recovery {
    enabled = var.point_in_time_recovery
  }
  
  # Server-side encryption
  dynamic "server_side_encryption" {
    for_each = var.server_side_encryption.enabled ? [1] : []
    content {
      enabled     = true
      kms_key_arn = var.server_side_encryption.kms_key_arn
    }
  }
  
  # Global Secondary Indexes
  dynamic "global_secondary_index" {
    for_each = var.global_secondary_indexes
    content {
      name            = global_secondary_index.value.name
      hash_key        = global_secondary_index.value.hash_key
      range_key       = global_secondary_index.value.range_key
      projection_type = global_secondary_index.value.projection_type
      
      read_capacity  = var.billing_mode == "PROVISIONED" ? global_secondary_index.value.read_capacity : null
      write_capacity = var.billing_mode == "PROVISIONED" ? global_secondary_index.value.write_capacity : null
      
      non_key_attributes = global_secondary_index.value.projection_type == "INCLUDE" ? global_secondary_index.value.projection_attributes : null
    }
  }
  
  # Local Secondary Indexes
  dynamic "local_secondary_index" {
    for_each = var.local_secondary_indexes
    content {
      name            = local_secondary_index.value.name
      range_key       = local_secondary_index.value.range_key
      projection_type = local_secondary_index.value.projection_type
      
      non_key_attributes = local_secondary_index.value.projection_type == "INCLUDE" ? local_secondary_index.value.projection_attributes : null
    }
  }
  
  tags = local.tags
}

# IAM Policy for Lambda access
data "aws_iam_policy_document" "table_access" {
  statement {
    effect = "Allow"
    
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:PartiQLSelect",
      "dynamodb:PartiQLInsert",
      "dynamodb:PartiQLUpdate",
      "dynamodb:PartiQLDelete"
    ]
    
    resources = [
      aws_dynamodb_table.this.arn,
      "${aws_dynamodb_table.this.arn}/index/*"
    ]
  }
  
  # Stream access if enabled
  dynamic "statement" {
    for_each = var.stream_enabled ? [1] : []
    content {
      effect = "Allow"
      
      actions = [
        "dynamodb:DescribeStream",
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:ListStreams"
      ]
      
      resources = [
        aws_dynamodb_table.this.stream_arn
      ]
    }
  }
}

resource "aws_iam_policy" "table_access" {
  name        = "${local.table_name}-access"
  description = "Access policy for ${local.table_name} DynamoDB table"
  policy      = data.aws_iam_policy_document.table_access.json
  tags        = local.tags
}

# Autoscaling resources (only for PROVISIONED mode)
resource "aws_appautoscaling_target" "table_read" {
  count = var.billing_mode == "PROVISIONED" && var.autoscaling_enabled ? 1 : 0
  
  max_capacity       = var.autoscaling_config.read_max_capacity
  min_capacity       = var.autoscaling_config.read_min_capacity
  resource_id        = "table/${aws_dynamodb_table.this.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_target" "table_write" {
  count = var.billing_mode == "PROVISIONED" && var.autoscaling_enabled ? 1 : 0
  
  max_capacity       = var.autoscaling_config.write_max_capacity
  min_capacity       = var.autoscaling_config.write_min_capacity
  resource_id        = "table/${aws_dynamodb_table.this.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "table_read" {
  count = var.billing_mode == "PROVISIONED" && var.autoscaling_enabled ? 1 : 0
  
  name               = "${local.table_name}-read-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.table_read[0].resource_id
  scalable_dimension = aws_appautoscaling_target.table_read[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.table_read[0].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = var.autoscaling_config.read_target_value
  }
}

resource "aws_appautoscaling_policy" "table_write" {
  count = var.billing_mode == "PROVISIONED" && var.autoscaling_enabled ? 1 : 0
  
  name               = "${local.table_name}-write-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.table_write[0].resource_id
  scalable_dimension = aws_appautoscaling_target.table_write[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.table_write[0].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = var.autoscaling_config.write_target_value
  }
}

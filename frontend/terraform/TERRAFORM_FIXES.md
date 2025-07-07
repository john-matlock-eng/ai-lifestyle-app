# Terraform Infrastructure Fixes

## Issues Fixed

### 1. CloudFront Logging Configuration Error
**Problem**: The `logging_config` block was trying to conditionally set values, but Terraform requires the entire block to be conditional.

**Solution**: Changed to use a `dynamic` block that only creates the logging configuration when `enable_logging` is true:

```hcl
# Before (incorrect)
logging_config {
  include_cookies = false
  bucket          = var.enable_logging ? aws_s3_bucket.logs[0].bucket_domain_name : null
  prefix          = var.enable_logging ? "cloudfront/" : null
}

# After (correct)
dynamic "logging_config" {
  for_each = var.enable_logging ? [1] : []
  content {
    include_cookies = false
    bucket          = aws_s3_bucket.logs[0].bucket_domain_name
    prefix          = "cloudfront/"
  }
}
```

### 2. S3 Lifecycle Configuration Warning
**Problem**: The lifecycle rule requires either a `filter` or `prefix` to be specified.

**Solution**: Added an empty `filter {}` block to satisfy the requirement:

```hcl
rule {
  id     = "delete-old-logs"
  status = "Enabled"

  filter {}  # Added this line

  expiration {
    days = 30
  }
}
```

## How Dynamic Blocks Work

The `dynamic` block in Terraform allows you to conditionally create configuration blocks:
- When `enable_logging = true`, `for_each = [1]` creates one instance of the block
- When `enable_logging = false`, `for_each = []` creates no instances

This is the proper way to conditionally include entire configuration blocks in Terraform.

## Next Steps

Run `terraform plan` again - these errors should now be resolved!

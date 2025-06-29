# Terraform Modules

This directory contains reusable Terraform modules for the AI Lifestyle App infrastructure.

## Available Modules

### 🚀 lambda-ecr
Deploy containerized Lambda functions using ECR images with ARM64 architecture.

**Key Features:**
- ARM64 support (20% cost savings)
- Container-based deployment
- X-Ray tracing
- CloudWatch Logs
- VPC support

### 🌐 api-gateway
Create HTTP API Gateways with Lambda integration.

**Key Features:**
- HTTP API v2 (lower latency, lower cost)
- Automatic Lambda permissions
- CORS configuration
- Per-route throttling
- Custom domains

### 💾 dynamodb
Create DynamoDB tables with best practices and Lambda access policies.

**Key Features:**
- On-demand or provisioned billing
- Global/Local secondary indexes
- DynamoDB Streams
- Auto-generated IAM policies
- Point-in-time recovery

### 📦 ecr
Manage ECR repositories for container images.

**Key Features:**
- Vulnerability scanning
- Lifecycle policies
- KMS encryption
- Cross-account access

## Usage Pattern

```hcl
module "example" {
  source = "./modules/module-name"
  
  # Required variables
  name        = "my-resource"
  environment = var.environment
  
  # Optional configurations
  ...
}
```

## Module Development Guidelines

1. **Naming Convention**: Use `{resource}-{environment}` pattern
2. **Tags**: Always include Module, Environment, and custom tags
3. **Outputs**: Export all important resource identifiers
4. **Documentation**: Each module has its own README.md
5. **Defaults**: Provide sensible defaults for optional variables

## Adding New Modules

1. Create a new directory under `modules/`
2. Add `variables.tf`, `main.tf`, `outputs.tf`
3. Include a `README.md` with usage examples
4. Test in both dev and prod environments
5. Update this index

## Dependencies

Modules can depend on outputs from other modules:

```
ECR → Lambda → API Gateway
       ↓
    DynamoDB
```

## Future Modules

- **s3**: Static storage and data lakes
- **cognito**: User authentication
- **eventbridge**: Event-driven workflows
- **step-functions**: Complex orchestration
- **sqs**: Message queuing

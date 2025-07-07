# Common Mistakes to Avoid - LLM Guide

## ❌ Critical Mistakes

### 1. Creating Separate Lambda Functions
**WRONG**:
```hcl
module "goals_lambda" {
  source = "./modules/lambda-ecr"
  function_name = "goals-handler"
  # ...
}
```

**RIGHT**: Use the existing `api_lambda` - it handles ALL routes via main.py

### 2. Creating Separate API Gateway Integrations
**WRONG**:
```hcl
resource "aws_apigatewayv2_integration" "goals" {
  # Separate integration for goals
}
```

**RIGHT**: All routes use the same Lambda integration already configured

### 3. Missing Router Updates
**WRONG**: Creating handler without updating main.py

**RIGHT**: Always add route to main.py:
```python
routes = {
    "GET /new-endpoint": new_handler,
}
```

### 4. Wrong Import Pattern
**WRONG**:
```python
# In main.py
from src.create_goal.handler import lambda_handler  # Wrong path
```

**RIGHT**:
```python
from create_goal.handler import lambda_handler as create_goal_handler
```

### 5. Creating terraform.tfvars
**WRONG**: Creating terraform.tfvars for CI/CD

**RIGHT**: GitHub Actions handles all variables automatically. Only create terraform.tfvars.example

### 6. Manual Deployment Commands
**WRONG**: Telling users to run `terraform apply`

**RIGHT**: Create PR - GitHub Actions handles everything

## ✅ Correct Patterns

### Adding New Endpoint
1. Update `src/main.py` routes dictionary
2. Create handler in `src/endpoint_name/`
3. Add route to terraform `api_gateway` module routes
4. Add environment variables to `api_lambda` if needed
5. Add IAM policies to `api_lambda` if needed
6. Create PR - let CI/CD deploy

### Path Parameters
The router handles extraction:
```python
# Route: GET /goals/{goalId}
# Router extracts goalId and adds to event['pathParameters']
```

### Environment Variables
Always add to the EXISTING api_lambda:
```hcl
module "api_lambda" {
  environment_variables = {
    # ... existing vars ...
    NEW_VAR = "value"  # Add here
  }
}
```

### IAM Policies
Add to the EXISTING api_lambda policies:
```hcl
module "api_lambda" {
  additional_policies = [
    # ... existing policies ...
    aws_iam_policy.new_policy.arn  # Add here
  ]
}
```

## Architecture Summary

```
API Gateway → Single Lambda (api-handler) → main.py router → Individual handlers
```

**NOT**:
```
API Gateway → Multiple Lambdas (one per endpoint)
```

## Quick Checklist
- [ ] Is there only ONE Lambda function (api_lambda)?
- [ ] Are ALL routes in the api_gateway routes configuration?
- [ ] Is main.py updated with the new route?
- [ ] Are all handlers imported in main.py?
- [ ] No manual terraform commands mentioned?
- [ ] No terraform.tfvars created (only .example)?
- [ ] PR-based deployment explained?

## Remember
- **One Lambda to rule them all** 🧙‍♂️
- **main.py is the router** 🔀
- **GitHub Actions deploys everything** 🚀
- **No manual terraform needed** 🚫

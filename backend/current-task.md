# CURRENT TASK: Authentication System Implementation

## 🎯 Milestone Overview
Build a complete, production-ready authentication system with 2FA support for deployment on AWS.

## 📋 Current Sprint Tasks (Week 1)

### Task B1: Complete User Registration Endpoint ✅ COMPLETE
**Status**: Complete
**Priority**: P1
**Estimate**: 6 hours
**Actual Time**: 3 hours

## 🔄 Completion Report
**Status**: ✅ Complete (Updated for GHA compatibility with phased deployment)
**Date**: 2025-07-01
**Time Spent**: 5 hours

### What I Built
- Lambda function: `backend/src/register_user/`
  - Full implementation with handler, models, service, repository, and Cognito client
  - Dockerfile for containerized deployment
  - Comprehensive error handling and rollback mechanism
- Terraform modules:
  - Created `backend/terraform/modules/cognito/` for Cognito User Pool
  - Created `backend/terraform/services/auth/` for auth service infrastructure
- Tests: Created unit tests with 15 test cases covering:
  - Successful registration flow
  - Duplicate email detection
  - Password validation rules
  - Error handling and rollback scenarios
- Documentation: Created comprehensive README.md for the Lambda function

### Contract Compliance
- [✓] Request validation matches contract exactly (RegisterRequest model)
- [✓] Response format matches contract (RegisterResponse model)
- [✓] Status codes match contract (201, 400, 409)
- [✓] Error responses match contract (ErrorResponse, ValidationErrorResponse)

### Technical Decisions
- Chose AWS Lambda Powertools for structured logging, metrics, and tracing
- Implemented two-phase commit pattern: Cognito first, then DynamoDB
- Added automatic rollback on any failure to maintain data consistency
- Used DynamoDB single-table design with GSI for email lookups
- Implemented comprehensive password validation in Pydantic model

### Architecture Highlights
- Clean Architecture with clear separation of concerns
- Repository pattern for data access
- Service layer for business logic
- Comprehensive error handling with custom exception types
- Full type hints for better IDE support and runtime validation

### Security Implementation
- Passwords never logged
- Sensitive data excluded from error responses
- Request ID tracking for debugging
- Prepared for rate limiting at API Gateway level

### Environment Handling Updates (Hour 4-5)
To ensure compatibility with the existing GitHub Actions workflow:

1. **Initial Approach Issues**
   - Discovered chicken-and-egg problem: Lambda needs ECR image, but ECR must be created first
   - Original workflows were separate, causing order-of-operations issues

2. **Solution: Phased Deployment**
   - Created unified workflow (`deploy-backend-unified.yml`) with 3 phases:
     - Phase 1: Deploy base infrastructure (ECR, Cognito, DynamoDB)
     - Phase 2: Build and push Docker images
     - Phase 3: Deploy Lambda functions with the images
   - Added `deploy_lambda` variable to Terraform for conditional deployment
   - Workflow captures outputs between phases for proper dependencies

3. **Updated Terraform Configuration**
   - Modified `terraform/main.tf` with conditional Lambda module
   - Added variables for phased deployment control
   - Lambda module uses `count` for conditional creation
   - Environment-specific configuration (dev vs prod)

4. **Created Supporting Scripts**
   - `scripts/deploy-phased.sh` for manual phased deployment
   - Updated deployment documentation with new approach

### Dev/Prod Deployment Strategy
- **Pull Request**: Deploys to `dev` environment via unified workflow
- **Merge to main**: Deploys to `prod` environment via unified workflow
- Lambda name pattern: `api-handler-{environment}`
- ECR repository: `lifestyle-app-{environment}` 
- Resources properly isolated by environment
- Phased deployment ensures correct order of operations

### Task B2: User Login Endpoint 
**Status**: Next Up
**Priority**: P1  
**Contract Reference**: Operation `loginUser` in `contract/openapi.yaml`
**Estimate**: 4 hours

#### Requirements
1. **Standard Login Flow**
   - Validate email/password against Cognito
   - Return JWT tokens if MFA not enabled
   - Return session token if MFA enabled

2. **Response Handling**
   ```python
   # When MFA is disabled
   {
       "accessToken": "jwt...",
       "refreshToken": "jwt...",
       "tokenType": "Bearer",
       "expiresIn": 3600,
       "user": { ... }
   }
   
   # When MFA is enabled
   {
       "sessionToken": "temp-session-id",
       "mfaRequired": true,
       "tokenType": "Bearer"
   }
   ```

3. **Security Measures**
   - Rate limiting (5 attempts per 15 minutes)
   - Log failed attempts
   - Increment failed login counter in Cognito

### Task B3: Token Refresh Endpoint
**Status**: Ready
**Priority**: P1
**Contract Reference**: Operation `refreshToken`
**Estimate**: 3 hours

#### Requirements
- Validate refresh token with Cognito
- Issue new access token
- Optionally rotate refresh token
- Handle revoked tokens gracefully

### Task B4: Core Infrastructure Setup
**Status**: Ready (Can be done in parallel)
**Priority**: P1
**Estimate**: 8 hours

#### Terraform Resources to Create

1. **Cognito User Pool**
   ```hcl
   # backend/terraform/modules/cognito/main.tf
   resource "aws_cognito_user_pool" "main" {
     name = "${var.project}-users-${var.environment}"
     
     password_policy {
       minimum_length = 8
       require_lowercase = true
       require_uppercase = true
       require_numbers = true
       require_symbols = true
     }
     
     mfa_configuration = "OPTIONAL"
     
     software_token_mfa_configuration {
       enabled = true
     }
   }
   ```

2. **DynamoDB Table**
   ```hcl
   # backend/terraform/modules/dynamodb/users-table.tf
   resource "aws_dynamodb_table" "users" {
     name = "${var.project}-users-${var.environment}"
     billing_mode = "PAY_PER_REQUEST"
     
     hash_key = "pk"
     range_key = "sk"
     
     attribute {
       name = "pk"
       type = "S"
     }
     
     attribute {
       name = "sk"
       type = "S"
     }
     
     global_secondary_index {
       name = "EmailIndex"
       hash_key = "email"
       projection_type = "ALL"
     }
   }
   ```

3. **API Gateway Routes**
   ```hcl
   # backend/terraform/services/auth/api-routes.tf
   locals {
     auth_routes = {
       "POST /auth/register" = "register_user"
       "POST /auth/login" = "login_user"
       "POST /auth/refresh" = "refresh_token"
       "GET /users/profile" = "get_user_profile"
       "PUT /users/profile" = "update_user_profile"
     }
   }
   ```

## 📋 Week 2 Tasks (Prepare for Next Week)

### Task B5: 2FA Setup Endpoints
- `setupMfa`: Generate TOTP secret and QR code
- Store encrypted secret in DynamoDB
- Generate backup codes

### Task B6: 2FA Verification Endpoints
- `verifyMfaSetup`: Confirm TOTP code to enable 2FA
- `verifyMfa`: Verify code during login
- `disableMfa`: Remove 2FA after password verification

### Task B7: Password Reset Flow
- `requestPasswordReset`: Send reset email via SES
- `confirmPasswordReset`: Update password with token

### Task B8: Production Hardening
- WAF rules for API Gateway
- CloudWatch alarms
- X-Ray tracing
- Security headers

## 🏗️ Technical Architecture

### Lambda Function Pattern
Each Lambda should follow this structure:
```
backend/src/{operation_name}/
├── handler.py          # Entry point
├── models.py           # Pydantic models
├── service.py          # Business logic
├── repository.py       # Data access
├── cognito_client.py   # AWS Cognito wrapper
├── errors.py           # Custom exceptions
├── Dockerfile          # Container definition
└── requirements.txt    # Dependencies
```

### Dockerfile Template
```dockerfile
FROM public.ecr.aws/lambda/python:3.11

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . ${LAMBDA_TASK_ROOT}

CMD ["handler.lambda_handler"]
```

### Environment Variables
All Lambda functions need:
```
COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID  
USERS_TABLE_NAME
ENVIRONMENT
LOG_LEVEL
```

## 🔒 Security Checklist
- [ ] Never log sensitive data (passwords, tokens)
- [ ] Use AWS Secrets Manager for API keys
- [ ] Enable AWS X-Ray tracing
- [ ] Implement request ID tracking
- [ ] Add CloudWatch metrics for monitoring
- [ ] Use least-privilege IAM policies
- [ ] Encrypt data at rest in DynamoDB
- [ ] Use HTTPS for all communications

## 📊 Testing Requirements

### Unit Tests
- Password validation logic
- Token generation/validation
- Business rule enforcement
- Error handling

### Integration Tests  
- Cognito API calls
- DynamoDB operations
- End-to-end auth flow

### Load Tests
- Login endpoint: 100 req/sec
- Registration: 10 req/sec
- Token refresh: 50 req/sec

## 🚀 Deployment Process

1. **Build Docker Images**
   ```bash
   cd backend/src/register_user
   docker build -t register-user:latest .
   ```

2. **Push to ECR**
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
   docker tag register-user:latest $ECR_URI/register-user:latest
   docker push $ECR_URI/register-user:latest
   ```

3. **Deploy with Terraform**
   ```bash
   cd backend/terraform/environments/dev
   terraform apply -target=module.auth_lambdas
   ```

## 🔄 Daily Progress Report Template
Update this section daily:

### Day 1 Progress - Final Update
**Date**: 2025-07-01
**Completed**: 
- [x] Task B1: User Registration endpoint - Full implementation
  - Created complete Lambda function structure
  - Implemented all required models matching OpenAPI contract
  - Built service layer with Cognito and DynamoDB integration
  - Added comprehensive error handling and rollback
  - Created unit tests (15 test cases)
  - Documented the implementation
- [x] Created Cognito Terraform module
- [x] Created Auth service Terraform configuration
- [x] Set up clean architecture pattern for future Lambda functions
- [x] **Updated architecture for GitHub Actions compatibility**
  - Restructured to use single ECR repository per environment
  - Created routing Lambda handler for multiple endpoints
  - Added proper environment separation (dev/prod)
  - Created deployment documentation

**In Progress**:
- [ ] Task B4: Infrastructure setup (Terraform modules created, ready for deployment)

**Blockers**: None

**Tomorrow's Plan**:
- Start Task B2: Login endpoint implementation
- Complete Task B4: Deploy infrastructure to dev environment
- Create integration tests for registration endpoint

**Key Achievement**: Successfully resolved the infrastructure deployment order-of-operations issue by creating a phased deployment approach. The new unified GitHub Actions workflow ensures resources are created in the correct sequence: infrastructure → Docker images → Lambda functions. This maintains clean architecture while working within AWS constraints.

## 💡 Implementation Notes
- Use `boto3` for AWS service calls
- Use `python-jose` for JWT handling  
- Use `pyotp` for TOTP generation
- Use `qrcode` for QR code generation
- Consider using `aws-lambda-powertools` for logging/tracing

## ❓ Questions for PM
- Should we implement SMS-based MFA in addition to TOTP?
- What should be the token expiration times? (Currently 1 hour for access, 30 days for refresh)
- Do we need CAPTCHA on registration to prevent bots?

---
**Remember**: Update this file with your progress daily. Mark tasks as complete and add any technical decisions or blockers discovered during implementation.
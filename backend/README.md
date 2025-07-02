# AI Lifestyle App - Backend

## Overview
Serverless backend for the AI Lifestyle App built with AWS Lambda, API Gateway, Cognito, and DynamoDB.

## 🚀 Current Status

### ✅ Implemented & Working
- **Health Check**: `GET /health`
- **User Registration**: `POST /auth/register`
- **User Login**: `POST /auth/login` (JWT tokens, MFA detection)

### 🔄 Next Priority
- **Token Refresh**: `POST /auth/refresh`
- **Email Verification**: `POST /auth/verify-email`
- **User Profile**: `GET /users/profile`

### 📋 Planned
- MFA/2FA verification endpoints
- Password reset flow
- User profile management
- Account deletion

### 🔗 API Documentation
- **Base URL**: `https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com`
- **Full Docs**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **OpenAPI Contract**: See [../contract/openapi.yaml](../contract/openapi.yaml)

## Architecture
- **Language**: Python 3.11
- **Framework**: AWS Lambda with API Gateway
- **Authentication**: AWS Cognito
- **Database**: DynamoDB (single-table design)
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions

## Project Structure
```
backend/
├── src/                    # Lambda function source code
│   ├── main.py            # Main router for all endpoints
│   ├── health.py          # Health check endpoint
│   ├── register_user/     # User registration endpoint
│   │   ├── handler.py     # Lambda handler
│   │   ├── models.py      # Pydantic models
│   │   ├── service.py     # Business logic
│   │   ├── repository.py  # DynamoDB access
│   │   └── cognito_client.py  # Cognito integration
│   └── [other endpoints]/
├── terraform/             # Infrastructure as Code
│   ├── main.tf           # Main Terraform configuration
│   ├── modules/          # Reusable Terraform modules
│   │   ├── cognito/      # Cognito User Pool
│   │   ├── dynamodb/     # DynamoDB tables
│   │   ├── ecr/          # ECR repositories
│   │   └── lambda-ecr/   # Lambda functions
│   └── services/         # Service-specific config
├── tests/                # Test suites
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── Dockerfile.api-handler  # Main Lambda container
├── Dockerfile.health-check # Health check container
├── requirements.txt       # Python dependencies
└── DEPLOYMENT.md         # Deployment guide
```

## Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- Docker installed
- Terraform 1.9+
- Python 3.11+

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt -r requirements-dev.txt

# Run tests
pytest tests/unit -v

# Build Docker image
docker build -f Dockerfile.api-handler -t ai-lifestyle-api:local .
```

### Deployment
Deployment is automated via GitHub Actions:
- **Pull Request**: Deploys to `dev` environment
- **Merge to main**: Deploys to `prod` environment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment information.

## API Endpoints

### System
- `GET /health` - Health check ✅

### Authentication
- `POST /auth/register` - User registration ✅
- `POST /auth/login` - User login ✅
- `POST /auth/refresh` - Refresh token 🔄 (in progress)
- `POST /auth/logout` - Logout 📋 (planned)
- `POST /auth/verify-email` - Email verification 🔄 (in progress)
- `POST /auth/password/reset` - Request password reset 📋 (planned)
- `POST /auth/password/confirm` - Confirm password reset 📋 (planned)

### User Management
- `GET /users/profile` - Get user profile 🔄 (in progress)
- `PUT /users/profile` - Update profile 📋 (planned)
- `DELETE /users/profile` - Delete account 📋 (planned)

### MFA/2FA
- `POST /auth/mfa/setup` - Setup MFA 📋 (planned)
- `POST /auth/mfa/verify-setup` - Verify MFA setup 📋 (planned)
- `POST /auth/mfa/verify` - Verify MFA code 📋 (planned)
- `DELETE /auth/mfa` - Disable MFA 📋 (planned)

## Environment Variables
All Lambda functions use these environment variables:
- `ENVIRONMENT` - dev/prod
- `LOG_LEVEL` - DEBUG/INFO
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `COGNITO_CLIENT_ID` - Cognito App Client ID
- `USERS_TABLE_NAME` - DynamoDB users table
- `CORS_ORIGIN` - Allowed CORS origin

## Development Guidelines

### Adding New Endpoints
1. Create a new directory in `src/{endpoint_name}/`
2. Follow the existing pattern (handler, models, service, repository)
3. Import the handler in `src/main.py`
4. Add route to the routing table
5. Write unit tests
6. Update OpenAPI contract if needed

### Code Style
- Use type hints for all functions
- Follow PEP 8 guidelines
- Use Pydantic for data validation
- Implement proper error handling
- Never log sensitive data

### Testing
- Unit tests for business logic
- Integration tests for AWS services
- Minimum 80% code coverage
- Test all error scenarios

## Security
- JWT tokens for authentication
- Least privilege IAM policies
- Encryption at rest and in transit
- No hardcoded secrets
- Input validation on all endpoints

## Monitoring
- CloudWatch Logs with structured logging
- X-Ray tracing enabled
- Custom CloudWatch metrics
- Alarms for errors and throttling

## Support
For questions or issues:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review the OpenAPI contract in `../contract/`
- Contact the Backend Agent via `current-task.md`

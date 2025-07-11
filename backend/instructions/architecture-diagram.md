# AI Lifestyle App - Backend Architecture Diagram

## Single Lambda Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   API Gateway                                    │
│                                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ GET /health │  │ POST /auth  │  │ GET /goals  │  │ POST /goals │  ...       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                 │                 │                 │                  │
│         └─────────────────┴─────────────────┴─────────────────┘                 │
│                                       │                                          │
│                                       ▼                                          │
│                            ALL ROUTES GO HERE                                    │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Single Lambda Function                                  │
│                            (api-handler)                                         │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                              main.py                                      │   │
│  │                                                                           │   │
│  │  routes = {                                                              │   │
│  │      "GET /health": health_handler,                                      │   │
│  │      "POST /auth/register": register_handler,                            │   │
│  │      "GET /goals": list_goals_handler,                                   │   │
│  │      "POST /goals": create_goal_handler,                                 │   │
│  │      # ... all other routes                                              │   │
│  │  }                                                                        │   │
│  │                                                                           │   │
│  │  def lambda_handler(event, context):                                     │   │
│  │      route = f"{event['httpMethod']} {event['path']}"                   │   │
│  │      handler = routes.get(route)                                         │   │
│  │      return handler(event, context)                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│                                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Handler Modules                                   │   │
│  │                                                                           │   │
│  │  src/                                                                     │   │
│  │  ├── health.py                    # Simple handlers                      │   │
│  │  ├── register_user/               # Complex handlers                     │   │
│  │  │   ├── handler.py                                                      │   │
│  │  │   ├── models.py                                                       │   │
│  │  │   └── service.py                                                      │   │
│  │  ├── list_goals/                                                         │   │
│  │  │   └── handler.py                                                      │   │
│  │  └── create_goal/                                                        │   │
│  │      ├── handler.py                                                      │   │
│  │      ├── models.py                                                       │   │
│  │      └── service.py                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AWS Resources                                       │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   DynamoDB   │  │   Cognito    │  │      S3      │  │     SQS      │       │
│  │              │  │              │  │              │  │              │       │
│  │ • users      │  │ • User Pool  │  │ • attachments│  │ • notifications│     │
│  │ • goals      │  │ • Client     │  │              │  │              │       │
│  │ • aggregates │  │              │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Flow (CI/CD)

```
Developer Creates PR
        │
        ▼
┌─────────────────┐
│ GitHub Actions  │
│ Workflow Starts │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│            Phase 1: Infrastructure          │
│                                             │
│  terraform apply -var="deploy_lambda=false" │
│                                             │
│  Creates:                                   │
│  • ECR Repository                           │
│  • DynamoDB Tables                          │
│  • S3 Buckets                               │
│  • Cognito User Pool                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           Phase 2: Docker Build             │
│                                             │
│  docker build -f Dockerfile.api-handler     │
│  docker push to ECR                         │
│                                             │
│  Includes:                                  │
│  • ALL handler code from src/               │
│  • main.py router                           │
│  • requirements.txt dependencies            │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│          Phase 3: Lambda Deployment         │
│                                             │
│  terraform apply -var="deploy_lambda=true"  │
│                                             │
│  Deploys:                                   │
│  • Single Lambda with new image             │
│  • All API Gateway routes active            │
│  • Environment variables configured         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
            ✅ Deployed!
```

## Key Points for LLMs

1. **ONE Lambda Function**: All endpoints handled by single Lambda
2. **Router Pattern**: main.py routes requests to handlers
3. **Module Structure**: Each endpoint has its own module in src/
4. **Shared Resources**: All handlers share the same environment variables and IAM roles
5. **CI/CD Automated**: No manual deployment steps needed

## Common Patterns

### Adding New Endpoint
```
1. Update main.py routes dict
2. Create handler module
3. Add route to terraform
4. Create PR
5. CI/CD deploys automatically
```

### Path Parameters
```python
# Route: GET /users/{userId}/profile
# main.py extracts userId → event['pathParameters']['userId']
```

### Environment Variables
```python
# All handlers access same env vars
TABLE_NAME = os.environ['USERS_TABLE_NAME']
```

## DO NOT

❌ Create separate Lambda functions  
❌ Create separate API Gateway integrations  
❌ Deploy manually with terraform  
❌ Skip updating main.py  
❌ Create terraform.tfvars (use CI/CD)  

## ALWAYS DO

✅ Use single Lambda pattern  
✅ Update main.py router  
✅ Let GitHub Actions deploy  
✅ Follow existing patterns  
✅ Test through main.py routing  

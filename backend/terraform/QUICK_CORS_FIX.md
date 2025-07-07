# Quick CORS Fix for Backend

## Immediate Fix - Update main.tf

Replace the cors_origins line in your API Gateway module configuration:

### Find this line (around line 156):
```hcl
cors_origins = var.environment == "prod" ? ["https://ailifestyle.app"] : ["*"]
```

### Replace with:
```hcl
cors_origins = ["*"]  # Allow all origins for now
```

## Also update the Lambda CORS_ORIGIN:

### Find this line (around line 134):
```hcl
CORS_ORIGIN = var.environment == "prod" ? "https://ailifestyle.app" : "*"
```

### Replace with:
```hcl
CORS_ORIGIN = "*"  # Allow all origins for now
```

## Apply the changes:

```bash
cd backend/terraform
terraform plan
terraform apply
```

## Important: Lambda Code Update

Your Lambda functions MUST return CORS headers. If they don't, you'll need to update the Lambda code to include:

```javascript
headers: {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Content-Type': 'application/json'
}
```

In EVERY response (both success and error responses).

## After Frontend is Stable

Once you know your CloudFront URL, update to be more restrictive:

```hcl
# For dev
cors_origins = ["https://d123456.cloudfront.net", "http://localhost:3000"]

# For prod  
cors_origins = ["https://your-prod-domain.com"]
```

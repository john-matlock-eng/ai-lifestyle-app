# Login Fix Summary - DynamoDB Schema Mismatch

## Issue Found
The login endpoint was failing with:
```
Query condition missed key schema element: gsi1_pk
```

## Root Cause
The registration and login repositories were using different DynamoDB schemas:

1. **Registration** (correct):
   - Query by email: `gsi1_pk = EMAIL#{email}`
   - Primary key: `pk = USER#{user_id}`, `sk = USER#{user_id}`
   - Fields: snake_case (e.g., `first_name`, `user_id`)

2. **Login** (incorrect):
   - Query by email: `email = email` (wrong!)
   - Primary key: `userId = user_id` (wrong!)
   - Expected fields: camelCase (e.g., `firstName`, `userId`)

## Files Fixed

### `/backend/src/login_user/repository.py`

1. **Fixed email query**:
   ```python
   # Old:
   KeyConditionExpression=Key('email').eq(email)
   
   # New:
   KeyConditionExpression=Key('gsi1_pk').eq(f'EMAIL#{email}')
   ```

2. **Fixed user ID query**:
   ```python
   # Old:
   Key={'userId': user_id}
   
   # New:
   Key={'pk': f'USER#{user_id}', 'sk': f'USER#{user_id}'}
   ```

3. **Added field mapping** in `_deserialize_user`:
   - Maps snake_case DynamoDB fields to camelCase for the service layer
   - Handles: userId, firstName, lastName, emailVerified, mfaEnabled, etc.

## Testing
After deployment, the login flow should work:
1. User registers successfully (already working)
2. User can now login with the same credentials
3. JWT tokens are returned
4. User profile is included in the response

## Deploy Command
```powershell
.\deploy-login-fix.ps1
```

This will:
1. Build the Docker image with the fixed code
2. Push to ECR
3. Update the Lambda function
4. Wait for deployment to complete

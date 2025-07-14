# Backend Requirements for User ID Sharing

## New API Endpoint Required

To fully support the User ID sharing feature, the backend needs a new endpoint:

### `GET /users/{userId}`

This endpoint should:
- Accept a Cognito User ID as a path parameter
- Return public user information (email, name)
- Require authentication
- NOT return sensitive information

### Endpoint Implementation

Create a new Lambda function: `get_user_by_id`

```python
# handler.py
def lambda_handler(event, context):
    # Extract userId from path parameters
    user_id = event['pathParameters']['userId']
    
    # Verify the caller is authenticated
    auth_header = event['headers'].get('Authorization')
    # ... validate token ...
    
    # Fetch user from DynamoDB
    user = repository.get_user_by_id(user_id)
    
    if not user:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'User not found'})
        }
    
    # Return only public information
    return {
        'statusCode': 200,
        'body': json.dumps({
            'userId': user['userId'],
            'email': user['email'],
            'firstName': user.get('firstName'),
            'lastName': user.get('lastName'),
            'hasEncryption': bool(user.get('publicKey'))
        })
    }
```

### Terraform Configuration

Add to `backend/terraform/main.tf`:

```hcl
"GET /users/{userId}" = {
  authorization_type = "JWT"
}
```

### Security Considerations

1. **Authentication Required**: The endpoint must require a valid JWT token
2. **Public Information Only**: Only return non-sensitive user data
3. **Rate Limiting**: Consider adding rate limiting to prevent user enumeration
4. **Audit Logging**: Log who is looking up which users

## Alternative: Use Existing Endpoint

If adding a new endpoint is not feasible immediately, the frontend can be modified to only support email-based sharing by removing the User ID functionality until the backend is ready.

## Testing the Feature

1. Create two test users
2. Get User A's Cognito ID from the profile dropdown
3. Log in as User B
4. Try to share an encrypted journal entry with User A using their ID
5. Verify the share is created successfully

## Implementation Priority

Since the frontend is ready, the backend endpoint should be implemented as soon as possible to enable the full functionality. Until then, the feature will only work with email addresses.
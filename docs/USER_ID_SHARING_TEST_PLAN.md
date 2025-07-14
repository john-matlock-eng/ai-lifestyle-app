# User ID Sharing Feature - Test Plan

## Summary

The user ID sharing feature is now fully implemented! Here's what was already completed:

### Backend Implementation ✅
- **Lambda Function**: `backend/src/get_user_by_id/` - Fully implemented with proper error handling
- **API Route**: `GET /users/{userId}` - Configured in Terraform and main.py routing
- **Security**: JWT authentication required, returns only public user information
- **Models**: Using `UserPublicInfo` model from `user_profile_common`

### Frontend Implementation ✅
- **User ID Display**: Shows in profile dropdown with copy button
- **ShareDialog**: Supports both email and User ID input with automatic detection
- **Validation**: UUID format validation for Cognito IDs

## Testing Steps

### 1. Deploy the Backend
```bash
# From backend directory
make build-lambda
make deploy ENV=dev
```

### 2. Test User ID Display
1. Log into the application
2. Click on your profile avatar in the top-right
3. You should see your User ID displayed with a copy button
4. Click the copy button - it should show a checkmark briefly

### 3. Test User ID Lookup API
```bash
# Get your auth token from the browser's network tab
AUTH_TOKEN="your-jwt-token"
USER_ID="target-user-cognito-id"
API_URL="your-api-gateway-url"

curl -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_URL/users/$USER_ID"
```

Expected response:
```json
{
  "userId": "12345678-1234-1234-1234-123456789012",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "hasEncryption": true
}
```

### 4. Test Sharing Flow
1. Create two test accounts (User A and User B)
2. Set up encryption for both users
3. As User A:
   - Copy your User ID from the profile dropdown
   - Create an encrypted journal entry
4. As User B:
   - Go to any encrypted journal entry
   - Click "Share"
   - Paste User A's User ID
   - The system should:
     - Detect it's a User ID (not email)
     - Look up the user
     - Allow sharing
5. Verify User A can see the shared entry

### 5. Error Cases to Test
- Invalid User ID format → "Invalid user ID format"
- Non-existent User ID → "User not found"
- No auth token → 401 Unauthorized
- User without encryption → Share succeeds but `hasEncryption: false`

## Troubleshooting

### If the endpoint returns 404 "ROUTE_NOT_FOUND"
- The Lambda needs to be deployed with the latest code
- Run `make deploy ENV=dev` from the backend directory

### If the endpoint returns 500
- Check CloudWatch logs for the Lambda function
- Ensure environment variables are set:
  - `COGNITO_USER_POOL_ID`
  - `COGNITO_CLIENT_ID`
  - `USERS_TABLE_NAME`

### If sharing fails
- Ensure both users have encryption set up
- Check that the recipient's public key is available
- Verify the journal entry has an `encryptedKey`

## Next Steps

The feature is complete! After testing, consider:
1. Adding rate limiting to prevent user enumeration
2. Adding audit logging for who looks up which users
3. Implementing the QR code feature mentioned in the guide
4. Adding a "recent recipients" list for convenience
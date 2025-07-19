# User ID Sharing Feature

## Overview

Users can now share encrypted journal entries and other items using either an email address or a Cognito User ID. This provides more flexibility for sharing, especially when users want to share with someone whose email they don't know but have their User ID.

## Features

### 1. User ID Display in Profile Dropdown

- Your Cognito User ID is now displayed in the profile dropdown menu
- Click the copy icon next to your User ID to copy it to clipboard
- The ID is displayed in a monospace font for easy reading
- A checkmark appears briefly when the ID is successfully copied

### 2. Enhanced Share Dialog

The share dialog now accepts two types of input:
- **Email Address**: Traditional sharing by email (e.g., `user@example.com`)
- **User ID**: Direct sharing using Cognito ID (e.g., `12345678-1234-1234-1234-123456789012`)

### 3. Automatic Detection

The system automatically detects whether you've entered:
- An email address (contains `@` symbol)
- A User ID (UUID format: 8-4-4-4-12 hexadecimal characters)

## How to Use

### Finding Your User ID

1. Click on your profile avatar in the top-right corner
2. Your User ID is displayed in the dropdown
3. Click the copy icon to copy it

### Sharing with a User ID

1. Open the share dialog for any encrypted item
2. In the "Share with" field, paste the recipient's User ID
3. Select permissions and expiration time
4. Click "Share"

### Backend API Requirements

The feature requires these API endpoints:
- `GET /users/{userId}` - Fetch user by Cognito ID
- `GET /users/by-email/{email}` - Existing endpoint for email lookup

## Security Considerations

- User IDs are not sensitive information and can be safely shared
- All shares remain end-to-end encrypted
- Permissions and expiration times work the same for both methods
- The recipient must have encryption set up to receive shares

## UI Components Updated

1. **Header.tsx**
   - Added User ID display with copy functionality
   - Added copy confirmation feedback

2. **ShareDialog.tsx**
   - Updated input placeholder to indicate both options
   - Added User ID validation (UUID format)
   - Added helpful hint text
   - Enhanced error messages for both lookup methods

## Implementation Details

### User ID Format Validation
```typescript
const isValidCognitoId = (input: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input);
};
```

### Copy to Clipboard
```typescript
const copyUserId = async () => {
  if (user?.userId) {
    await navigator.clipboard.writeText(user.userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }
};
```

## Future Enhancements

Consider these potential improvements:
1. QR code generation for easy User ID sharing
2. Recent recipients list
3. User ID search/autocomplete
4. Bulk sharing to multiple User IDs
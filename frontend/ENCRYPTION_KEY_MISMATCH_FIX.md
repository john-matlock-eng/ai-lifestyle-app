# Encryption Key Mismatch Fix

## Problem Description

Users were experiencing an issue where they could encrypt journal entries but immediately could not decrypt them, resulting in an `OperationError`. The error message indicated that content was encrypted with different keys than those being used for decryption.

## Root Cause Analysis

### 1. **Singleton Service Caching Issue**
The `JournalService` was caching the encryption service instance at class initialization:
```typescript
export class JournalService {
  private encryptionService = getEncryptionService(); // Cached reference
```

This meant that if the encryption service's internal state changed (e.g., after setup), the journal service would still use the old reference with outdated keys.

### 2. **Key Replacement During 409 Conflict**
When setting up encryption, if the server already had keys (409 error), the code would:
1. Generate new local keys
2. Try to save them to the server
3. Get a 409 error
4. Fetch server keys and replace local keys

However, the newly generated keys were already set on the instance, and encryption might happen with these keys before they were replaced.

### 3. **Missing State Cleanup**
The encryption service wasn't properly clearing its state when:
- Replacing keys after a 409 error
- User logs out
- Keys need to be reset

## Solution Implementation

### 1. **Remove Service Caching**
Changed `JournalService` to always get a fresh encryption service instance:
```typescript
export class JournalService {
  // No more cached reference - always get fresh instance
```

All method calls now use `getEncryptionService()` directly to ensure they get the current instance with the correct keys.

### 2. **Proper Key Replacement in setupNewUser**
When getting a 409 error and replacing with server keys:
```typescript
// CRITICAL: Clear the newly generated keys first
this.personalKeyPair = null;
this.publicKeyId = null;

// Then load server keys...
// ... 

// IMPORTANT: Return early - we've successfully synced with server
return;
```

### 3. **Clear Encryption on Logout**
Added encryption cleanup to the logout process:
```typescript
// Clear encryption state
const encryptionService = getEncryptionService();
encryptionService.clear();
```

### 4. **Enhanced Logging**
Added comprehensive logging to track:
- Which public key ID is being used for encryption
- Key replacement operations
- Decryption attempts with key fingerprints

## Key Principles

1. **Always Use Fresh Service References**: Don't cache the encryption service - always get it fresh
2. **Clear State Before Replacement**: When replacing keys, clear existing state first
3. **Early Return on Success**: When syncing with server keys, return immediately to prevent further operations
4. **Consistent State Management**: Ensure encryption state is cleared on logout

## Testing the Fix

1. **New Encryption Setup**:
   - Set up encryption for the first time
   - Create an encrypted journal entry
   - Verify it can be decrypted immediately

2. **409 Conflict Scenario**:
   - Set up encryption on one device
   - Try to set up on another device (should get 409)
   - Verify keys sync properly and entries can be decrypted

3. **Logout/Login Cycle**:
   - Create encrypted entry
   - Log out and log back in
   - Verify entry can still be decrypted

## Future Improvements

1. **Key Versioning**: Add version numbers to keys to detect mismatches
2. **Key Fingerprints**: Generate and store key fingerprints for easier debugging
3. **Automatic Key Recovery**: Detect key mismatches and offer automatic recovery options
4. **Better Error Messages**: Provide more specific error messages based on the type of key mismatch

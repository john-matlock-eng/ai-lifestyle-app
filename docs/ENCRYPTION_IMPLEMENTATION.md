# Zero-Knowledge Encryption Implementation

This document describes the implementation of the zero-knowledge encryption system for the AI Lifestyle App.

## Overview

The encryption system provides:
- ✅ **Cross-device access** - Users can access encrypted content from any device
- ✅ **User-to-user sharing** - Share encrypted entries with specific people
- ✅ **AI analysis** - Time-limited AI access without permanent storage
- ✅ **Recovery options** - Multiple methods to recover access if password is forgotten

## Architecture

### Key Hierarchy

```
Master Password (user's mind)
    ↓ PBKDF2 + Salt (100k iterations)
Master Key (session only)
    ↓ Encrypts
Private Key (stored encrypted on server)
    ↓ Decrypts
Content Keys (per entry)
    ↓ Encrypts
Journal/Goal Data
```

### Components

#### Backend Lambda Functions

1. **setup_encryption** - Initialize encryption for a user
2. **check_encryption** - Check if user has encryption set up
3. **get_user_public_key** - Get a user's public key for sharing
4. **create_share** - Create a share with another user
5. **create_ai_share** - Create time-limited AI shares
6. **list_shares** - List active shares
7. **revoke_share** - Revoke an active share
8. **setup_recovery** - Set up recovery methods

#### Frontend Components

1. **EncryptionService** - Core encryption/decryption logic
2. **ShareDialog** - UI for sharing with users
3. **AIShareDialog** - UI for AI analysis
4. **ShareManagement** - Manage active shares
5. **RecoverySetup** - Set up recovery methods
6. **JournalEntryDetail** - Journal view with sharing features

#### Infrastructure

1. **DynamoDB** - Store encryption keys and shares
2. **SSM Parameter Store** - AI service keys
3. **SQS** - Queue for AI analysis requests
4. **CloudWatch** - Monitoring and alerts

## API Endpoints

### Encryption Setup
```
POST /encryption/setup
{
  "salt": "base64_salt",
  "encryptedPrivateKey": "base64_encrypted_key",
  "publicKey": "base64_public_key",
  "publicKeyId": "unique_key_id"
}
```

### Check Encryption Status
```
GET /encryption/check/{userId}
Response: {
  "hasEncryption": boolean,
  "publicKeyId": "string",
  "recoveryEnabled": boolean
}
```

### Get User Public Key
```
GET /encryption/user/{userId}
Response: {
  "userId": "string",
  "publicKey": "base64_public_key",
  "publicKeyId": "string"
}
```

### Create Share
```
POST /encryption/shares
{
  "itemType": "journal",
  "itemId": "entry_id",
  "recipientId": "user_id",
  "encryptedKey": "base64_encrypted_key",
  "expiresInHours": 24,
  "permissions": ["read", "comment"]
}
```

### AI Share
```
POST /encryption/ai-shares
{
  "itemType": "journal",
  "itemIds": ["entry1", "entry2"],
  "analysisType": "sentiment",
  "context": "optional context",
  "expiresInMinutes": 30
}
```

## Data Storage

### DynamoDB Schema

**Encryption Keys**
```
PK: USER#{userId}
SK: ENCRYPTION#KEYS
Attributes:
  - Salt
  - EncryptedPrivateKey
  - PublicKey
  - PublicKeyId
  - RecoveryEnabled
  - RecoveryMethods
```

**Shares**
```
PK: USER#{recipientId}
SK: SHARE#{shareId}
GSI1_PK: USER#{ownerId}
GSI1_SK: SHARE#CREATED#{shareId}
Attributes:
  - ShareId
  - OwnerId
  - RecipientId
  - ItemType
  - ItemId
  - EncryptedKey
  - Permissions
  - ExpiresAt
  - AccessCount
  - MaxAccesses
  - IsActive
```

## Security Features

### Zero-Knowledge Architecture
- Server never sees plaintext data or passwords
- All encryption/decryption happens client-side
- Master key never leaves the user's browser

### Time-Limited AI Access
- AI shares expire after 30 minutes
- Single-use tokens
- Automatic cleanup of expired shares
- No permanent storage of decrypted data

### Share Controls
- Granular permissions (read, comment, reshare)
- Expiration dates
- Access count limits
- Instant revocation

### Recovery Methods
1. **Mnemonic Phrase** - 24-word recovery phrase
2. **Social Recovery** - M-of-N trusted contacts
3. **Security Questions** - Personal Q&A pairs

## Development Guide

### Adding Encryption to a New Feature

1. **Frontend Integration**
```typescript
// Use the encryption service
import { getEncryptionService } from '@/services/encryption';

// Encrypt data
const encrypted = await encryptionService.encryptContent(data);

// Share with user
const share = await encryptionService.shareWithUser(
  'feature_type',
  itemId,
  recipientUserId,
  encrypted.encryptedKey
);
```

2. **Backend Storage**
```python
# Store encrypted data with keys
item = {
    'content': encrypted_content,
    'encrypted_key': encrypted_key,
    'encryption_iv': iv,
    'is_encrypted': True
}
```

### Testing

1. **Unit Tests**
   - Test encryption/decryption roundtrip
   - Test key derivation
   - Test share creation/revocation

2. **Integration Tests**
   - Test cross-device access
   - Test share expiration
   - Test recovery flows

3. **Security Tests**
   - Verify server can't decrypt data
   - Test time-limit enforcement
   - Test permission controls

## Deployment

### Environment Variables
```
TABLE_NAME=ai-lifestyle-{env}
AI_SERVICE_PUBLIC_KEY_PARAM=/ai-lifestyle-app/ai-service/public-key
AI_ANALYSIS_QUEUE_URL=https://sqs.region.amazonaws.com/account/queue-name
```

### IAM Permissions
- DynamoDB read/write on main table
- SSM parameter read for AI keys
- SQS send message for AI analysis

### Monitoring
- CloudWatch alarms for failed shares
- SQS queue depth monitoring
- Lambda error rates

## Future Enhancements

1. **Batch Operations**
   - Bulk sharing
   - Batch AI analysis
   - Mass revocation

2. **Advanced Recovery**
   - Hardware key support
   - Biometric recovery
   - Time-delayed recovery

3. **Audit Trail**
   - Share access logs
   - Encryption events
   - Recovery attempts

4. **Performance**
   - Key caching
   - Parallel encryption
   - WebWorker support

## Migration Guide

For users with existing local encryption:

1. App detects local encryption on login
2. Prompts user to enter encryption password
3. Uploads salt and encrypted keys to server
4. Maintains backward compatibility
5. Enables cross-device access

## Security Considerations

1. **Password Requirements**
   - Minimum 12 characters
   - Complexity requirements
   - No password reuse

2. **Key Rotation**
   - Periodic key rotation
   - Graceful migration
   - Backward compatibility

3. **Compliance**
   - HIPAA compliant architecture
   - GDPR data portability
   - Right to deletion

## Support

For issues or questions:
1. Check CloudWatch logs
2. Verify IAM permissions
3. Test with encryption disabled
4. Contact security team for key issues

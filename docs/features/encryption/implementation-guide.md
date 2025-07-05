# End-to-End Encryption - Implementation Guide

## Quick Start

This guide provides step-by-step instructions for implementing client-side encryption in the AI Lifestyle App.

## Prerequisites

### Dependencies
```json
{
  "dependencies": {
    "@noble/ed25519": "^2.0.0",      // Fast elliptic curve crypto
    "@noble/hashes": "^1.3.3",        // Hashing functions
    "idb": "^8.0.0",                  // IndexedDB wrapper
    "bip39": "^3.1.0",                // Mnemonic generation
    "@scure/bip32": "^1.3.3"          // Key derivation
  }
}
```

### Browser Requirements
- Web Crypto API support (all modern browsers)
- IndexedDB for secure key storage
- Web Workers for performance

## Step 1: Set Up Encryption Service

### Core Service Structure
```typescript
// src/services/encryption/EncryptionService.ts
import { openDB, DBSchema } from 'idb';
import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { generateMnemonic, mnemonicToSeed } from 'bip39';

interface EncryptionDB extends DBSchema {
  keys: {
    key: string;
    value: {
      type: 'master' | 'personal' | 'content';
      encryptedKey?: ArrayBuffer;
      publicKey?: string;
      metadata: any;
    };
  };
  cache: {
    key: string;
    value: {
      data: ArrayBuffer;
      expiry: number;
    };
  };
}

export class EncryptionService {
  private db: Promise<IDBDatabase>;
  private masterKey: CryptoKey | null = null;
  
  constructor() {
    this.db = this.initDB();
  }
  
  private async initDB() {
    return openDB<EncryptionDB>('encryption', 1, {
      upgrade(db) {
        db.createObjectStore('keys');
        db.createObjectStore('cache');
      },
    });
  }
  
  async initialize(password: string): Promise<void> {
    // Check if already initialized
    const existingSalt = await this.getSalt();
    
    if (existingSalt) {
      // Derive master key from existing salt
      this.masterKey = await this.deriveMasterKey(password, existingSalt);
      await this.unlockPersonalKeys();
    } else {
      // First time setup
      await this.setupNewUser(password);
    }
  }
}
```

## Step 2: Key Generation and Management

### Master Key Derivation
```typescript
private async deriveMasterKey(
  password: string, 
  salt: Uint8Array
): Promise<CryptoKey> {
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive AES key from password
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // Not extractable
    ['encrypt', 'decrypt']
  );
}

private async setupNewUser(password: string): Promise<void> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(32));
  
  // Derive master key
  this.masterKey = await this.deriveMasterKey(password, salt);
  
  // Generate personal keypair
  const keyPair = await this.generateKeyPair();
  
  // Encrypt private key with master key
  const encryptedPrivateKey = await this.encryptKey(
    keyPair.privateKey,
    this.masterKey
  );
  
  // Store everything
  const db = await this.db;
  await db.put('keys', {
    type: 'master',
    metadata: { salt: Array.from(salt) }
  }, 'master-key-info');
  
  await db.put('keys', {
    type: 'personal',
    encryptedKey: encryptedPrivateKey,
    publicKey: await this.exportPublicKey(keyPair.publicKey),
    metadata: { 
      created: Date.now(),
      algorithm: 'RSA-OAEP'
    }
  }, 'personal-keypair');
  
  // Send public key to server
  await this.registerPublicKey(keyPair.publicKey);
}
```

### Personal Key Pair Generation
```typescript
private async generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

private async encryptKey(
  key: CryptoKey,
  masterKey: CryptoKey
): Promise<ArrayBuffer> {
  // Export key to raw format
  const rawKey = await crypto.subtle.exportKey('pkcs8', key);
  
  // Encrypt with master key
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    rawKey
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return combined.buffer;
}
```

## Step 3: Content Encryption

### Encrypt Journal Entry
```typescript
export async function encryptJournalEntry(
  content: string,
  encryption: EncryptionService
): Promise<EncryptedEntry> {
  // Generate unique content key for this entry
  const contentKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Encrypt the content
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedContent = new TextEncoder().encode(content);
  
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    contentKey,
    encodedContent
  );
  
  // Get user's public key
  const publicKey = await encryption.getPublicKey();
  
  // Encrypt content key with public key
  const rawContentKey = await crypto.subtle.exportKey('raw', contentKey);
  const encryptedContentKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawContentKey
  );
  
  // Prepare metadata (unencrypted)
  const metadata = {
    wordCount: content.split(/\s+/).length,
    charCount: content.length,
    created: new Date().toISOString(),
    encryptionVersion: '1.0',
    keyId: await encryption.getKeyId()
  };
  
  return {
    encryptedContent: arrayToBase64(encryptedContent),
    encryptedKey: arrayToBase64(encryptedContentKey),
    iv: arrayToBase64(iv),
    metadata
  };
}

// Utility functions
function arrayToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArray(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
```

### Decrypt Journal Entry
```typescript
export async function decryptJournalEntry(
  encryptedEntry: EncryptedEntry,
  encryption: EncryptionService
): Promise<string> {
  // Get private key
  const privateKey = await encryption.getPrivateKey();
  
  // Decrypt content key
  const encryptedKey = base64ToArray(encryptedEntry.encryptedKey);
  const rawContentKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedKey
  );
  
  // Import content key
  const contentKey = await crypto.subtle.importKey(
    'raw',
    rawContentKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // Decrypt content
  const encryptedContent = base64ToArray(encryptedEntry.encryptedContent);
  const iv = base64ToArray(encryptedEntry.iv);
  
  const decryptedContent = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    contentKey,
    encryptedContent
  );
  
  return new TextDecoder().decode(decryptedContent);
}
```

## Step 4: Secure Sharing Implementation

### Share with Friend
```typescript
export async function shareEncryptedEntry(
  entryId: string,
  friendUserId: string,
  encryption: EncryptionService
): Promise<void> {
  // 1. Fetch friend's public key from server
  const friendPublicKeyData = await api.getUserPublicKey(friendUserId);
  const friendPublicKey = await importPublicKey(friendPublicKeyData);
  
  // 2. Get the encrypted entry
  const entry = await api.getEncryptedEntry(entryId);
  
  // 3. Decrypt content key with our private key
  const privateKey = await encryption.getPrivateKey();
  const encryptedKey = base64ToArray(entry.encryptedKey);
  
  const rawContentKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedKey
  );
  
  // 4. Re-encrypt content key with friend's public key
  const friendEncryptedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    friendPublicKey,
    rawContentKey
  );
  
  // 5. Create share record
  await api.createShare({
    entryId,
    sharedWith: friendUserId,
    encryptedKey: arrayToBase64(friendEncryptedKey),
    permissions: {
      canRead: true,
      canComment: true,
      canReshare: false,
      expiresAt: null
    }
  });
}

async function importPublicKey(keyData: string): Promise<CryptoKey> {
  const binaryKey = base64ToArray(keyData);
  return crypto.subtle.importKey(
    'spki',
    binaryKey,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    false,
    ['encrypt']
  );
}
```

## Step 5: Recovery System

### Generate Recovery Phrase
```typescript
export async function setupRecoveryPhrase(
  encryption: EncryptionService
): Promise<string> {
  // Generate 24-word mnemonic
  const mnemonic = generateMnemonic(256);
  
  // Derive recovery key from mnemonic
  const seed = await mnemonicToSeed(mnemonic);
  const recoveryKey = await crypto.subtle.importKey(
    'raw',
    seed.slice(0, 32), // Use first 32 bytes
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  // Get master key
  const masterKeyData = await encryption.exportMasterKey();
  
  // Encrypt master key with recovery key
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedMasterKey = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    recoveryKey,
    masterKeyData
  );
  
  // Store encrypted master key on server
  await api.storeRecoveryData({
    encryptedMasterKey: arrayToBase64(encryptedMasterKey),
    iv: arrayToBase64(iv),
    method: 'mnemonic',
    hint: 'Use your 24-word recovery phrase'
  });
  
  return mnemonic;
}

export async function recoverWithPhrase(
  mnemonic: string,
  newPassword: string
): Promise<void> {
  // Get recovery data from server
  const recoveryData = await api.getRecoveryData();
  
  // Derive recovery key from mnemonic
  const seed = await mnemonicToSeed(mnemonic);
  const recoveryKey = await crypto.subtle.importKey(
    'raw',
    seed.slice(0, 32),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt master key
  const encryptedMasterKey = base64ToArray(recoveryData.encryptedMasterKey);
  const iv = base64ToArray(recoveryData.iv);
  
  const masterKeyData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    recoveryKey,
    encryptedMasterKey
  );
  
  // Re-encrypt with new password
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const newMasterKey = await deriveMasterKey(newPassword, salt);
  
  // ... continue recovery process
}
```

## Step 6: React Integration

### Encryption Context Provider
```typescript
// src/contexts/EncryptionContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { EncryptionService } from '@/services/encryption';

interface EncryptionContextType {
  isInitialized: boolean;
  isEncryptionEnabled: boolean;
  encryptEntry: (content: string) => Promise<EncryptedEntry>;
  decryptEntry: (entry: EncryptedEntry) => Promise<string>;
  shareEntry: (entryId: string, userId: string) => Promise<void>;
  setupRecovery: () => Promise<string>;
}

const EncryptionContext = createContext<EncryptionContextType | null>(null);

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const [encryption] = useState(() => new EncryptionService());
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Check if user has encryption setup
    const checkEncryption = async () => {
      const hasEncryption = await encryption.checkSetup();
      setIsInitialized(hasEncryption);
    };
    
    checkEncryption();
  }, []);
  
  const value: EncryptionContextType = {
    isInitialized,
    isEncryptionEnabled: isInitialized,
    encryptEntry: (content) => encryptJournalEntry(content, encryption),
    decryptEntry: (entry) => decryptJournalEntry(entry, encryption),
    shareEntry: (entryId, userId) => shareEncryptedEntry(entryId, userId, encryption),
    setupRecovery: () => setupRecoveryPhrase(encryption)
  };
  
  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}

export const useEncryption = () => {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryption must be used within EncryptionProvider');
  }
  return context;
};
```

### Using in Components
```typescript
// src/features/journal/components/JournalEditor.tsx
import { useEncryption } from '@/contexts/EncryptionContext';

export function JournalEditor() {
  const { isEncryptionEnabled, encryptEntry } = useEncryption();
  const [enableEncryption, setEnableEncryption] = useState(true);
  
  const handleSave = async (content: string) => {
    if (enableEncryption && isEncryptionEnabled) {
      // Encrypt before saving
      const encrypted = await encryptEntry(content);
      await api.saveEncryptedEntry(encrypted);
    } else {
      // Save unencrypted
      await api.saveEntry({ content });
    }
  };
  
  return (
    <div>
      {isEncryptionEnabled && (
        <EncryptionToggle
          value={enableEncryption}
          onChange={setEnableEncryption}
        />
      )}
      
      <Editor onSave={handleSave} />
    </div>
  );
}
```

## Step 7: Testing

### Unit Tests
```typescript
// src/services/encryption/__tests__/encryption.test.ts
import { EncryptionService } from '../EncryptionService';

describe('EncryptionService', () => {
  let encryption: EncryptionService;
  
  beforeEach(() => {
    encryption = new EncryptionService();
  });
  
  test('should derive consistent keys from password', async () => {
    const password = 'test-password-123';
    const salt = new Uint8Array(32).fill(1);
    
    const key1 = await encryption.deriveMasterKey(password, salt);
    const key2 = await encryption.deriveMasterKey(password, salt);
    
    // Keys should be identical for same password/salt
    expect(key1).toEqual(key2);
  });
  
  test('should encrypt and decrypt content', async () => {
    const content = 'My secret journal entry';
    await encryption.initialize('password123');
    
    const encrypted = await encryptJournalEntry(content, encryption);
    const decrypted = await decryptJournalEntry(encrypted, encryption);
    
    expect(decrypted).toBe(content);
  });
  
  test('should share entry with friend', async () => {
    // ... test sharing flow
  });
});
```

## Performance Considerations

### 1. Use Web Workers
```typescript
// src/workers/encryption.worker.ts
const worker = new Worker(
  new URL('./encryption.worker.ts', import.meta.url),
  { type: 'module' }
);

// Offload heavy encryption to worker
async function encryptInWorker(content: string): Promise<EncryptedEntry> {
  return new Promise((resolve) => {
    worker.postMessage({ action: 'encrypt', content });
    worker.addEventListener('message', (e) => {
      if (e.data.action === 'encrypted') {
        resolve(e.data.result);
      }
    }, { once: true });
  });
}
```

### 2. Cache Decrypted Content
```typescript
class DecryptionCache {
  private cache = new Map<string, { content: string; expiry: number }>();
  private maxSize = 50;
  
  set(entryId: string, content: string): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(entryId, {
      content,
      expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
  }
  
  get(entryId: string): string | null {
    const cached = this.cache.get(entryId);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(entryId);
      return null;
    }
    
    return cached.content;
  }
}
```

## Security Checklist

- [ ] Never log passwords or keys
- [ ] Clear sensitive data from memory after use
- [ ] Use constant-time comparison for sensitive operations
- [ ] Implement rate limiting for decryption attempts
- [ ] Add integrity checks (HMAC) to detect tampering
- [ ] Regular key rotation reminders
- [ ] Secure key backup reminders
- [ ] Monitor for unusual decryption patterns

## Deployment

### Environment Variables
```env
# .env.production
REACT_APP_ENCRYPTION_ENABLED=true
REACT_APP_KEY_DERIVATION_ITERATIONS=100000
REACT_APP_RSA_KEY_SIZE=4096
```

### Feature Flags
```typescript
const FEATURES = {
  encryption: {
    enabled: process.env.REACT_APP_ENCRYPTION_ENABLED === 'true',
    recoveryPhrase: true,
    socialRecovery: false, // Phase 2
    keyRotation: false     // Phase 2
  }
};
```

This implementation provides a secure, performant foundation for end-to-end encryption in your journaling feature!
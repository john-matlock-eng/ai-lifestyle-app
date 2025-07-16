/**
 * End-to-End Encryption Service using Web Crypto API
 * 
 * Implements zero-knowledge encryption following the architecture
 * described in the encryption documentation.
 */

import { keyStore } from './keyStore';
import apiClient from '../../api/client';

export interface EncryptedData {
  content: string;      // Base64 encoded encrypted content
  encryptedKey: string; // Base64 encoded encrypted content key
  iv: string;          // Base64 encoded initialization vector
}

export class EncryptionService {
  private masterKey: CryptoKey | null = null;
  private personalKeyPair: CryptoKeyPair | null = null;
  private publicKeyId: string | null = null;

  /**
   * Initialize the encryption service with user's password
   */
  async initialize(password: string, userId: string): Promise<void> {
    try {
      // Check if user has encryption set up on server
      const response = await apiClient.get(`/encryption/check/${userId}`);
      const encryptionStatus = response.data;
      
      if (encryptionStatus.hasEncryption) {
        // User has encryption on server, fetch salt
        const userResponse = await apiClient.get(`/encryption/user/${userId}`);
        const encryptionData = userResponse.data;
        
        // Convert base64 salt to Uint8Array
        const salt = this.base64ToArrayBuffer(encryptionData.salt);
        await keyStore.setSalt(new Uint8Array(salt));
        
        // Derive master key
        this.masterKey = await this.deriveMasterKey(password, new Uint8Array(salt));
        
        // Get encrypted private key from server response
        const encryptedPrivateKey = this.base64ToArrayBuffer(encryptionData.encryptedPrivateKey);
        
        // Store keys locally
        await keyStore.setPersonalKeys(
          encryptedPrivateKey,
          encryptionData.publicKey,
          encryptionData.publicKeyId
        );
        
        // Load personal keys
        await this.loadPersonalKeys(encryptedPrivateKey);
        this.publicKeyId = encryptionData.publicKeyId;
      } else {
        // First time setup
        await this.setupNewUser(password, userId);
      }
    } catch (error) {
      // If server check fails, fall back to local-only mode
      console.warn('Server check failed, using local encryption:', error);
      
      const salt = await keyStore.getSalt();
      if (salt) {
        this.masterKey = await this.deriveMasterKey(password, salt);
        const personalKeys = await keyStore.getPersonalKeys();
        if (personalKeys) {
          await this.loadPersonalKeys(personalKeys.privateKey);
          this.publicKeyId = personalKeys.publicKeyId;
        }
      } else {
        await this.setupNewUser(password, userId);
      }
    }
  }

  /**
   * Check if encryption is set up for the user
   */
  async checkSetup(): Promise<boolean> {
    const salt = await keyStore.getSalt();
    return salt !== null;
  }

  /**
   * Derive master key from password using PBKDF2
   */
  private async deriveMasterKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Set up encryption for a new user
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async setupNewUser(password: string, _userId: string): Promise<void> {
    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(32));
    await keyStore.setSalt(salt);

    // Derive master key
    this.masterKey = await this.deriveMasterKey(password, salt);

    // Generate personal keypair
    this.personalKeyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Generate public key ID
    this.publicKeyId = this.generateKeyId();

    // Export and encrypt private key
    const privateKeyData = await crypto.subtle.exportKey('pkcs8', this.personalKeyPair.privateKey);
    const encryptedPrivateKey = await this.encryptWithMasterKey(privateKeyData);

    // Export public key
    const publicKeyData = await crypto.subtle.exportKey('spki', this.personalKeyPair.publicKey);
    const publicKeyBase64 = this.arrayBufferToBase64(publicKeyData);

    // Store keys locally
    await keyStore.setPersonalKeys(encryptedPrivateKey, publicKeyBase64, this.publicKeyId);
    
    try {
      // Save to server for cross-device access
      await apiClient.post('/encryption/setup', {
        salt: this.arrayBufferToBase64(salt),
        encryptedPrivateKey: this.arrayBufferToBase64(encryptedPrivateKey),
        publicKey: publicKeyBase64,
        publicKeyId: this.publicKeyId
      });
    } catch (error) {
      console.warn('Failed to save encryption keys to server:', error);
      // Continue with local-only encryption
    }
  }

  /**
   * Load personal keys from storage
   */
  private async loadPersonalKeys(encryptedPrivateKey: ArrayBuffer): Promise<void> {
    if (!this.masterKey) throw new Error('Master key not initialized');

    // Decrypt private key
    const privateKeyData = await this.decryptWithMasterKey(encryptedPrivateKey);

    // Import keys
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['decrypt']
    );

    const personalKeys = await keyStore.getPersonalKeys();
    if (!personalKeys) throw new Error('Personal keys not found');

    const publicKeyData = this.base64ToArrayBuffer(personalKeys.publicKey);
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    );

    this.personalKeyPair = { privateKey, publicKey };
  }

  /**
   * Encrypt content with a new content key
   */
  async encryptContent(content: string): Promise<EncryptedData> {
    if (!this.personalKeyPair) throw new Error('Encryption not initialized');

    // Generate content key
    const contentKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt content
    const encoder = new TextEncoder();
    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      contentKey,
      encoder.encode(content)
    );

    // Export content key
    const rawContentKey = await crypto.subtle.exportKey('raw', contentKey);

    // Encrypt content key with public key
    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      this.personalKeyPair.publicKey,
      rawContentKey
    );

    return {
      content: this.arrayBufferToBase64(encryptedContent),
      encryptedKey: this.arrayBufferToBase64(encryptedKey),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  /**
   * Decrypt content using the encrypted content key
   */
  async decryptContent(encryptedData: EncryptedData): Promise<string> {
    if (!this.personalKeyPair) throw new Error('Encryption not initialized');

    // Decrypt content key
    const encryptedKey = this.base64ToArrayBuffer(encryptedData.encryptedKey);
    const rawContentKey = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      this.personalKeyPair.privateKey,
      encryptedKey
    );

    // Import content key
    const contentKey = await crypto.subtle.importKey(
      'raw',
      rawContentKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt content
    const encryptedContent = this.base64ToArrayBuffer(encryptedData.content);
    const iv = this.base64ToArrayBuffer(encryptedData.iv);

    const decryptedContent = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      contentKey,
      encryptedContent
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  }

  /**
   * Generate recovery phrase (simplified - in production use BIP39)
   */
  async generateRecoveryPhrase(): Promise<string> {
    // In production, use a proper BIP39 implementation
    const words = [];
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    
    // Simple word list for demo
    const wordList = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance'
    ];

    // Generate 24 words based on random bytes
    for (let i = 0; i < 24; i++) {
      const index = bytes[i] % wordList.length;
      words.push(wordList[index]);
    }

    return words.join(' ');
  }

  /**
   * Share entries with AI for analysis
   */
  async shareWithAI(
    itemType: string,
    itemIds: string[],
    analysisType: string,
    context?: string
  ): Promise<{ analysisRequestId: string; shareIds: string[] }> {
    if (!this.personalKeyPair) throw new Error('Encryption not initialized');

    try {
      // Create AI shares with limited time access
      const response = await apiClient.post('/ai-shares', {
        itemType,
        itemIds,
        analysisType,
        context,
        expiresInMinutes: 30 // AI shares expire quickly
      });

      return {
        analysisRequestId: response.data.analysisRequestId,
        shareIds: response.data.shareIds
      };
    } catch (error) {
      console.error('Failed to create AI share:', error);
      throw error;
    }
  }

  /**
   * Get list of active shares
   */
  async getShares(itemType?: string): Promise<Array<{
    id: string;
    recipientId: string;
    itemType: string;
    itemId: string;
    createdAt: string;
    expiresAt?: string;
  }>> {
    try {
      const params = itemType ? { itemType } : {};
      const response = await apiClient.get('/shares', { params });
      return response.data.shares || [];
    } catch (error) {
      console.error('Failed to get shares:', error);
      return [];
    }
  }

  /**
   * Revoke a share
   */
  async revokeShare(shareId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/shares/${shareId}`);
      return true;
    } catch (error) {
      console.error('Failed to revoke share:', error);
      return false;
    }
  }

  /**
   * Set up recovery method
   */
  async setupRecovery(
    method: 'mnemonic' | 'social' | 'questions',
    recoveryData: {
      mnemonicPhrase?: string;
      socialGuardians?: string[];
      socialThreshold?: number;
      securityQuestions?: Array<{ question: string; answer: string }>;
    }
  ): Promise<boolean> {
    if (!this.masterKey) throw new Error('Master key not initialized');

    try {
      // Export master key for recovery encryption
      const masterKeyData = await crypto.subtle.exportKey('raw', this.masterKey);
      
      // Encrypt master key with recovery method
      // In production, this would use the recovery data to encrypt the master key
      // For example:
      // - Mnemonic: Derive key from phrase and encrypt master key
      // - Social: Split key using Shamir's secret sharing
      // - Questions: Derive key from answers and encrypt master key
      
      const encryptedRecoveryKey = this.arrayBufferToBase64(masterKeyData); // Simplified

      await apiClient.post('/encryption/recovery', {
        method,
        ...recoveryData,
        encryptedRecoveryKey
      });

      return true;
    } catch (error) {
      console.error('Failed to set up recovery:', error);
      return false;
    }
  }

  /**
   * Share an encrypted entry with another user
   */
  async shareWithUser(
    itemType: string,
    itemId: string,
    recipientUserId: string,
    encryptedKey: string,
    expiresInHours?: number,
    permissions?: string[]
  ): Promise<{ shareId: string; encryptedKey: string }> {
    if (!this.personalKeyPair) throw new Error('Encryption not initialized');

    try {
      // 1. Fetch recipient's public key from server
      const recipientResponse = await apiClient.get(`/encryption/user/${recipientUserId}`);
      const recipientData = recipientResponse.data;
      
      if (!recipientData.publicKey) {
        throw new Error('Recipient has not set up encryption');
      }
      
      // 2. Decrypt content key with our private key
      const encryptedKeyBuffer = this.base64ToArrayBuffer(encryptedKey);
      const contentKeyBuffer = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        this.personalKeyPair.privateKey,
        encryptedKeyBuffer
      );
      
      // 3. Import recipient's public key
      const recipientPublicKeyData = this.base64ToArrayBuffer(recipientData.publicKey);
      const recipientPublicKey = await crypto.subtle.importKey(
        'spki',
        recipientPublicKeyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        true,
        ['encrypt']
      );
      
      // 4. Re-encrypt content key with recipient's public key
      const reEncryptedKey = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        recipientPublicKey,
        contentKeyBuffer
      );
      
      // 5. Create share on server
      const shareResponse = await apiClient.post('/shares', {
        itemType,
        itemId,
        recipientId: recipientUserId,
        encryptedKey: this.arrayBufferToBase64(reEncryptedKey),
        expiresInHours,
        permissions
      });
      
      return {
        shareId: shareResponse.data.shareId,
        encryptedKey: this.arrayBufferToBase64(reEncryptedKey)
      };
    } catch (error) {
      console.error('Failed to share with user:', error);
      throw error;
    }
  }

  /**
   * Encrypt data with master key
   */
  private async encryptWithMasterKey(data: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.masterKey) throw new Error('Master key not initialized');

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return combined.buffer;
  }

  /**
   * Decrypt data with master key
   */
  private async decryptWithMasterKey(data: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.masterKey) throw new Error('Master key not initialized');

    const dataArray = new Uint8Array(data);
    const iv = dataArray.slice(0, 12);
    const encrypted = dataArray.slice(12);

    return crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      encrypted
    );
  }

  /**
   * Generate a unique key ID
   */
  private generateKeyId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Get the public key ID
   */
  async getPublicKeyId(): Promise<string | null> {
    return this.publicKeyId;
  }

  /**
   * Clear all encryption data (logout)
   */
  async clear(): Promise<void> {
    this.masterKey = null;
    this.personalKeyPair = null;
    this.publicKeyId = null;
    // Note: We don't clear the keyStore here as the user might want to log back in
  }

  /**
   * Reset encryption (delete all keys)
   */
  async reset(): Promise<void> {
    await keyStore.clearAll();
    this.masterKey = null;
    this.personalKeyPair = null;
    this.publicKeyId = null;
  }
}

// Singleton instance
let encryptionService: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new EncryptionService();
  }
  return encryptionService;
}
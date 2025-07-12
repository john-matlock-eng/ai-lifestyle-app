/**
 * End-to-End Encryption Service using Web Crypto API
 * 
 * Implements zero-knowledge encryption following the architecture
 * described in the encryption documentation.
 */

import { keyStore } from './keyStore';

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
  async initialize(password: string): Promise<void> {
    // Check if we have an existing salt
    const salt = await keyStore.getSalt();
    
    if (salt) {
      // Derive master key from existing salt
      this.masterKey = await this.deriveMasterKey(password, salt);
      
      // Try to decrypt personal keys
      const personalKeys = await keyStore.getPersonalKeys();
      if (personalKeys) {
        await this.loadPersonalKeys(personalKeys.privateKey);
        this.publicKeyId = personalKeys.publicKeyId;
      }
    } else {
      // First time setup
      await this.setupNewUser(password);
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
  private async setupNewUser(password: string): Promise<void> {
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

    // Store keys
    await keyStore.setPersonalKeys(encryptedPrivateKey, publicKeyBase64, this.publicKeyId);
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
   * Share an encrypted entry with another user
   */
  async shareWithUser(
    _entryId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _recipientUserId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _encryptedKey: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<string> {
    if (!this.personalKeyPair) throw new Error('Encryption not initialized');

    // In production, this would:
    // 1. Fetch recipient's public key from server
    // 2. Decrypt content key with our private key
    // 3. Re-encrypt with recipient's public key
    
    // For now, return a demo encrypted key
    const demoKey = crypto.getRandomValues(new Uint8Array(32));
    return this.arrayBufferToBase64(demoKey);
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
   * Clear all encryption data (logout)
   */
  async clear(): Promise<void> {
    this.masterKey = null;
    this.personalKeyPair = null;
    this.publicKeyId = null;
    // Note: We don't clear the keyStore here as the user might want to log back in
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
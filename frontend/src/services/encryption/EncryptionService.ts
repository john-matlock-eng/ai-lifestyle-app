/**
 * End-to-End Encryption Service using Web Crypto API
 *
 * Implements zero-knowledge encryption following the architecture
 * described in the encryption documentation.
 */

import { keyStore } from "./keyStore";
import apiClient from "../../api/client";

export interface EncryptedData {
  content: string; // Base64 encoded encrypted content
  encryptedKey: string; // Base64 encoded encrypted content key
  iv: string; // Base64 encoded initialization vector
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
      console.log("[Encryption] Starting initialization for user", userId);

      // Check if user has encryption set up on server
      const response = await apiClient.get(`/encryption/check/${userId}`);
      const encryptionStatus = response.data;

      if (encryptionStatus.hasEncryption) {
        console.log("[Encryption] User has server-side encryption setup");

        // User has encryption on server, fetch salt
        const userResponse = await apiClient.get(`/encryption/user/${userId}`);
        const encryptionData = userResponse.data;

        console.log("[Encryption] Retrieved encryption data", {
          hasSalt: !!encryptionData.salt,
          hasEncryptedPrivateKey: !!encryptionData.encryptedPrivateKey,
          hasPublicKey: !!encryptionData.publicKey,
          publicKeyId: encryptionData.publicKeyId,
        });

        // Check if server has complete encryption data
        if (!encryptionData.salt || !encryptionData.encryptedPrivateKey) {
          console.warn(
            "[Encryption] Server has incomplete encryption data, resetting encryption",
          );

          // Clear local data to force fresh setup
          await keyStore.clearAll();

          // Set up new encryption
          await this.setupNewUser(password, userId);
          return;
        }

        // Convert base64 salt to Uint8Array
        const salt = this.base64ToArrayBuffer(encryptionData.salt);
        await keyStore.setSalt(new Uint8Array(salt));

        // Derive master key
        this.masterKey = await this.deriveMasterKey(
          password,
          new Uint8Array(salt),
        );

        // Get encrypted private key from server response
        const encryptedPrivateKey = this.base64ToArrayBuffer(
          encryptionData.encryptedPrivateKey,
        );

        // Store keys locally
        await keyStore.setPersonalKeys(
          encryptedPrivateKey,
          encryptionData.publicKey,
          encryptionData.publicKeyId,
        );

        // Load personal keys
        await this.loadPersonalKeys(encryptedPrivateKey);
        this.publicKeyId = encryptionData.publicKeyId;

        console.log("[Encryption] Initialization complete", {
          publicKeyId: this.publicKeyId,
          hasPrivateKey: !!this.personalKeyPair?.privateKey,
          hasPublicKey: !!this.personalKeyPair?.publicKey,
        });
      } else {
        // Server has no encryption setup
        console.log(
          "[Encryption] No server encryption found, checking for existing local keys",
        );
        
        // CRITICAL FIX: Check if user already has local keys before generating new ones
        const existingLocalKeys = await keyStore.getPersonalKeys();
        const existingSalt = await keyStore.getSalt();
        
        if (existingLocalKeys && existingSalt) {
          console.log(
            "[Encryption] Found existing local keys, verifying they match any server state",
          );
          
          // Derive master key from existing salt
          this.masterKey = await this.deriveMasterKey(password, existingSalt);
          
          // Load existing personal keys
          await this.loadPersonalKeys(existingLocalKeys.privateKey);
          this.publicKeyId = existingLocalKeys.publicKeyId;
          
          // First, check if server actually has encryption data by trying to fetch it
          try {
            const checkResponse = await apiClient.get(`/encryption/user/${userId}`);
            const serverData = checkResponse.data;
            
            if (serverData.publicKeyId) {
              // Server has encryption data, verify it matches our local keys
              if (serverData.publicKeyId === existingLocalKeys.publicKeyId) {
                console.log(
                  "[Encryption] Local keys match server keys, no upload needed",
                );
              } else {
                console.warn(
                  "[Encryption] Local keys do not match server keys!",
                  {
                    localKeyId: existingLocalKeys.publicKeyId,
                    serverKeyId: serverData.publicKeyId,
                  },
                );
                throw new Error(
                  "Encryption keys are out of sync. Please reset encryption in your profile settings.",
                );
              }
            } else {
              // Server has no public key ID, try to upload our local keys
              console.log(
                "[Encryption] Server has no encryption data, uploading local keys",
              );
              
              try {
                await apiClient.post("/encryption/setup", {
                  salt: this.arrayBufferToBase64(existingSalt),
                  encryptedPrivateKey: this.arrayBufferToBase64(existingLocalKeys.privateKey),
                  publicKey: existingLocalKeys.publicKey,
                  publicKeyId: existingLocalKeys.publicKeyId,
                });
                
                console.log(
                  "[Encryption] Successfully uploaded existing local keys to server",
                );
              } catch (uploadError) {
                // Check if it's a 409 conflict (already exists)
                if (uploadError instanceof Error && 'response' in uploadError) {
                  const axiosError = uploadError as { response?: { status?: number } };
                  if (axiosError.response?.status === 409) {
                    console.log(
                      "[Encryption] Server reports encryption already exists (409), using local keys",
                    );
                  } else {
                    console.warn(
                      "[Encryption] Failed to upload existing keys to server, continuing with local-only encryption:",
                      uploadError,
                    );
                  }
                } else {
                  console.warn(
                    "[Encryption] Failed to upload existing keys to server:",
                    uploadError,
                  );
                }
              }
            }
          } catch (checkError) {
            // Could not check server state, just use local keys
            console.warn(
              "[Encryption] Could not verify server encryption state, using local keys:",
              checkError,
            );
          }
        } else {
          // Truly a new user with no existing keys
          console.log(
            "[Encryption] No existing local keys found, setting up new user",
          );
          await this.setupNewUser(password, userId);
        }
      }
    } catch (error) {
      // If server check fails, fall back to local-only mode
      console.warn(
        "[Encryption] Server check failed, using local encryption:",
        error,
      );

      const salt = await keyStore.getSalt();
      if (salt) {
        this.masterKey = await this.deriveMasterKey(password, salt);
        const personalKeys = await keyStore.getPersonalKeys();
        if (personalKeys) {
          await this.loadPersonalKeys(personalKeys.privateKey);
          this.publicKeyId = personalKeys.publicKeyId;

          // Check if local keys match server (if we can)
          try {
            const userResponse = await apiClient.get(
              `/encryption/user/${userId}`,
            );
            const serverKeyId = userResponse.data?.publicKeyId;

            if (serverKeyId && serverKeyId !== this.publicKeyId) {
              console.warn(
                "[Encryption] Local keys do not match server keys!",
                {
                  localKeyId: this.publicKeyId,
                  serverKeyId: serverKeyId,
                },
              );

              // Prompt user to re-sync or re-setup encryption
              throw new Error(
                "Encryption keys are out of sync. Please reset encryption in your profile settings.",
              );
            }
          } catch (checkError) {
            console.warn("[Encryption] Could not verify key sync:", checkError);
          }
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
   * Check if encryption is initialized and ready to use
   */
  isInitialized(): boolean {
    return this.masterKey !== null && this.personalKeyPair !== null;
  }

  /**
   * Derive master key from password using PBKDF2
   */
  private async deriveMasterKey(
    password: string,
    salt: Uint8Array,
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
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
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );

    // Generate public key ID
    this.publicKeyId = this.generateKeyId();

    // Export and encrypt private key
    const privateKeyData = await crypto.subtle.exportKey(
      "pkcs8",
      this.personalKeyPair.privateKey,
    );
    const encryptedPrivateKey = await this.encryptWithMasterKey(privateKeyData);

    // Export public key
    const publicKeyData = await crypto.subtle.exportKey(
      "spki",
      this.personalKeyPair.publicKey,
    );
    const publicKeyBase64 = this.arrayBufferToBase64(publicKeyData);

    // Store keys locally
    await keyStore.setPersonalKeys(
      encryptedPrivateKey,
      publicKeyBase64,
      this.publicKeyId,
    );

    try {
      // Save to server for cross-device access
      await apiClient.post("/encryption/setup", {
        salt: this.arrayBufferToBase64(salt),
        encryptedPrivateKey: this.arrayBufferToBase64(encryptedPrivateKey),
        publicKey: publicKeyBase64,
        publicKeyId: this.publicKeyId,
      });
      console.log("[Encryption] Successfully saved new encryption keys to server");
    } catch (error) {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 409) {
          console.log("[Encryption] Server already has encryption setup - this is fine");
          // This can happen if there's a race condition or the state is out of sync
          // The keys are already set up locally, so we can continue
        } else {
          console.warn("Failed to save encryption keys to server:", error);
          // Continue with local-only encryption
        }
      } else {
        console.warn("Failed to save encryption keys to server:", error);
        // Continue with local-only encryption
      }
    }
  }

  /**
   * Load personal keys from storage
   */
  private async loadPersonalKeys(
    encryptedPrivateKey: ArrayBuffer,
  ): Promise<void> {
    if (!this.masterKey) throw new Error("Master key not initialized");

    // Decrypt private key
    const privateKeyData = await this.decryptWithMasterKey(encryptedPrivateKey);

    // Import keys
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyData,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"],
    );

    const personalKeys = await keyStore.getPersonalKeys();
    if (!personalKeys) throw new Error("Personal keys not found");

    const publicKeyData = this.base64ToArrayBuffer(personalKeys.publicKey);
    const publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyData,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    );

    this.personalKeyPair = { privateKey, publicKey };
  }

  /**
   * Encrypt content with a new content key
   */
  async encryptContent(content: string): Promise<EncryptedData> {
    if (!this.isInitialized()) {
      throw new Error("Encryption not initialized. Please set up or unlock encryption first.");
    }

    // Generate content key
    const contentKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt content
    const encoder = new TextEncoder();
    const encryptedContent = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      contentKey,
      encoder.encode(content),
    );

    // Export content key
    const rawContentKey = await crypto.subtle.exportKey("raw", contentKey);

    // Encrypt content key with public key
    const encryptedKey = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      this.personalKeyPair!.publicKey,
      rawContentKey,
    );

    return {
      content: this.arrayBufferToBase64(encryptedContent),
      encryptedKey: this.arrayBufferToBase64(encryptedKey),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  /**
   * Decrypt content using the encrypted content key
   */
  async decryptContent(encryptedData: EncryptedData): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error("Encryption not initialized. Please unlock encryption first.");
    }

    try {
      // Decrypt content key
      const encryptedKey = this.base64ToArrayBuffer(encryptedData.encryptedKey);

      console.log("[Decryption] Attempting to decrypt content key", {
        encryptedKeyLength: encryptedKey.byteLength,
        hasPrivateKey: !!this.personalKeyPair!.privateKey,
        publicKeyId: this.publicKeyId,
      });

      const rawContentKey = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        this.personalKeyPair!.privateKey,
        encryptedKey,
      );

      // Import content key
      const contentKey = await crypto.subtle.importKey(
        "raw",
        rawContentKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"],
      );

      // Decrypt content
      const encryptedContent = this.base64ToArrayBuffer(encryptedData.content);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);

      const decryptedContent = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        contentKey,
        encryptedContent,
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedContent);
    } catch (error) {
      console.error("[Decryption] Failed to decrypt content", {
        error,
        errorName: error instanceof Error ? error.name : "Unknown",
        errorMessage: error instanceof Error ? error.message : String(error),
        hasEncryptedKey: !!encryptedData.encryptedKey,
        hasIv: !!encryptedData.iv,
        publicKeyId: this.publicKeyId,
      });
      throw error;
    }
  }

  /**
   * Try to decrypt content with fallback to server re-sync
   */
  async tryDecryptWithFallback(
    encryptedData: EncryptedData
  ): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error("Encryption not initialized. Please unlock encryption to view encrypted content.");
    }

    try {
      // First, try with current keys
      return await this.decryptContent(encryptedData);
    } catch (error) {
      console.error("[Decryption] Failed with current keys, checking for alternatives", error);
      
      // Check if this might be a key mismatch issue
      if (error instanceof Error && error.name === "OperationError") {
        // This typically indicates wrong key was used for decryption
        const errorMessage = 
          "Unable to decrypt content. This may be due to:\n" +
          "1. The content was encrypted with a different encryption key\n" +
          "2. Your encryption keys are out of sync\n" +
          "3. The content may be corrupted\n\n" +
          "Try resetting your encryption in Settings > Security, or contact support.";
        
        throw new Error(errorMessage);
      }
      
      throw error;
    }
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
      "abandon",
      "ability",
      "able",
      "about",
      "above",
      "absent",
      "absorb",
      "abstract",
      "absurd",
      "abuse",
      "access",
      "accident",
      "account",
      "accuse",
      "achieve",
      "acid",
      "acoustic",
      "acquire",
      "across",
      "act",
      "action",
      "actor",
      "actress",
      "actual",
      "adapt",
      "add",
      "addict",
      "address",
      "adjust",
      "admit",
      "adult",
      "advance",
    ];

    // Generate 24 words based on random bytes
    for (let i = 0; i < 24; i++) {
      const index = bytes[i] % wordList.length;
      words.push(wordList[index]);
    }

    return words.join(" ");
  }

  /**
   * Share entries with AI for analysis
   */
  async shareWithAI(
    itemType: string,
    itemIds: string[],
    analysisType: string,
    context?: string,
  ): Promise<{ analysisRequestId: string; shareIds: string[] }> {
    if (!this.isInitialized()) {
      throw new Error("Encryption not initialized. Please unlock encryption first.");
    }

    try {
      // Create AI shares with limited time access
      const response = await apiClient.post("/ai-shares", {
        itemType,
        itemIds,
        analysisType,
        context,
        expiresInMinutes: 30, // AI shares expire quickly
      });

      return {
        analysisRequestId: response.data.analysisRequestId,
        shareIds: response.data.shareIds,
      };
    } catch (error) {
      console.error("Failed to create AI share:", error);
      throw error;
    }
  }

  /**
   * Get list of active shares
   */
  async getShares(itemType?: string): Promise<
    Array<{
      id: string;
      recipientId: string;
      itemType: string;
      itemId: string;
      createdAt: string;
      expiresAt?: string;
    }>
  > {
    try {
      const params = itemType ? { itemType } : {};
      const response = await apiClient.get("/shares", { params });
      return response.data.shares || [];
    } catch (error) {
      console.error("Failed to get shares:", error);
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
      console.error("Failed to revoke share:", error);
      return false;
    }
  }

  /**
   * Set up recovery method
   */
  async setupRecovery(
    method: "mnemonic" | "social" | "questions",
    recoveryData: {
      mnemonicPhrase?: string;
      socialGuardians?: string[];
      socialThreshold?: number;
      securityQuestions?: Array<{ question: string; answer: string }>;
    },
  ): Promise<boolean> {
    if (!this.masterKey) throw new Error("Master key not initialized");

    try {
      // Export master key for recovery encryption
      const masterKeyData = await crypto.subtle.exportKey(
        "raw",
        this.masterKey,
      );

      // Encrypt master key with recovery method
      // In production, this would use the recovery data to encrypt the master key
      // For example:
      // - Mnemonic: Derive key from phrase and encrypt master key
      // - Social: Split key using Shamir's secret sharing
      // - Questions: Derive key from answers and encrypt master key

      const encryptedRecoveryKey = this.arrayBufferToBase64(masterKeyData); // Simplified

      await apiClient.post("/encryption/recovery", {
        method,
        ...recoveryData,
        encryptedRecoveryKey,
      });

      return true;
    } catch (error) {
      console.error("Failed to set up recovery:", error);
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
    permissions?: string[],
  ): Promise<{ shareId: string; encryptedKey: string }> {
    if (!this.isInitialized()) {
      throw new Error("Encryption not initialized. Please unlock encryption first.");
    }

    try {
      console.log("[Sharing] Starting share process", {
        itemType,
        itemId,
        recipientUserId,
        encryptedKeyLength: encryptedKey.length,
        ownerPublicKeyId: this.publicKeyId,
      });

      // 1. Fetch recipient's public key from server
      const recipientResponse = await apiClient.get(
        `/encryption/user/${recipientUserId}`,
      );
      const recipientData = recipientResponse.data;

      if (!recipientData.publicKey) {
        throw new Error("Recipient has not set up encryption");
      }

      console.log("[Sharing] Got recipient encryption data", {
        recipientHasPublicKey: !!recipientData.publicKey,
        recipientPublicKeyId: recipientData.publicKeyId,
      });

      // 2. Decrypt content key with our private key
      const encryptedKeyBuffer = this.base64ToArrayBuffer(encryptedKey);
      const contentKeyBuffer = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        this.personalKeyPair!.privateKey,
        encryptedKeyBuffer,
      );

      console.log("[Sharing] Decrypted content key", {
        contentKeyLength: contentKeyBuffer.byteLength,
      });

      // 3. Import recipient's public key
      const recipientPublicKeyData = this.base64ToArrayBuffer(
        recipientData.publicKey,
      );
      const recipientPublicKey = await crypto.subtle.importKey(
        "spki",
        recipientPublicKeyData,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["encrypt"],
      );

      // 4. Re-encrypt content key with recipient's public key
      const reEncryptedKey = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        recipientPublicKey,
        contentKeyBuffer,
      );

      const reEncryptedKeyBase64 = this.arrayBufferToBase64(reEncryptedKey);

      console.log("[Sharing] Re-encrypted content key", {
        reEncryptedKeyLength: reEncryptedKey.byteLength,
        reEncryptedKeyBase64Length: reEncryptedKeyBase64.length,
      });

      // 5. Create share on server
      const shareResponse = await apiClient.post("/shares", {
        itemType,
        itemId,
        recipientId: recipientUserId,
        encryptedKey: reEncryptedKeyBase64,
        expiresInHours,
        permissions,
      });

      console.log("[Sharing] Share created successfully", {
        shareId: shareResponse.data.shareId,
      });

      return {
        shareId: shareResponse.data.shareId,
        encryptedKey: reEncryptedKeyBase64,
      };
    } catch (error) {
      console.error("[Sharing] Failed to share with user", {
        error,
        errorName: error instanceof Error ? error.name : "Unknown",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Encrypt data with master key
   */
  private async encryptWithMasterKey(data: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.masterKey) throw new Error("Master key not initialized");

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      this.masterKey,
      data,
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
    if (!this.masterKey) throw new Error("Master key not initialized");

    const dataArray = new Uint8Array(data);
    const iv = dataArray.slice(0, 12);
    const encrypted = dataArray.slice(12);

    return crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      this.masterKey,
      encrypted,
    );
  }

  /**
   * Generate a unique key ID
   */
  private generateKeyId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
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
   * Safe decrypt for background/caching operations
   * Returns null if encryption is not initialized instead of throwing
   */
  async safeDecryptContent(encryptedData: EncryptedData): Promise<string | null> {
    try {
      if (!this.isInitialized()) {
        console.log("[Encryption] Skipping decryption - encryption not initialized");
        return null;
      }
      return await this.decryptContent(encryptedData);
    } catch (error) {
      console.warn("[Encryption] Safe decrypt failed:", error);
      return null;
    }
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

  /**
   * Force re-sync encryption with server
   * Use this when local and server keys are out of sync
   */
  async forceResync(password: string, userId: string): Promise<void> {
    console.log("[Encryption] Force resyncing encryption");

    try {
      // First check what's on the server
      const userResponse = await apiClient.get(`/encryption/user/${userId}`);
      const serverData = userResponse.data;

      // If server has incomplete data, we can safely delete and recreate
      if (!serverData.salt || !serverData.encryptedPrivateKey) {
        console.log("[Encryption] Server has incomplete data, resetting everything");
        
        // Clear all local data
        await this.reset();

        // Delete server encryption data
        try {
          await apiClient.delete("/encryption/keys");
          console.log("[Encryption] Deleted incomplete server encryption data");
        } catch (error) {
          console.warn("[Encryption] Could not delete server data:", error);
        }

        // Re-initialize with fresh setup
        await this.initialize(password, userId);
      } else {
        // Server has complete data, try to sync with it
        console.log("[Encryption] Server has complete data, attempting to sync");
        
        // Clear local data only
        await this.reset();
        
        // Re-initialize will pull from server
        await this.initialize(password, userId);
      }
    } catch (error) {
      console.error("[Encryption] Error checking server data:", error);
      
      // If we can't check server data, just clear local and try to init
      await this.reset();
      await this.initialize(password, userId);
    }
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

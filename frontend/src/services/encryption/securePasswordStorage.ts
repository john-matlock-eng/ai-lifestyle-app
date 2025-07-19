/**
 * Secure Password Storage Service
 * Encrypts and stores the master password locally using a device-specific key
 */

class SecurePasswordStorage {
  private readonly STORAGE_KEY = "ai-lifestyle-enc-pwd";
  private readonly DEVICE_KEY = "ai-lifestyle-device-key";
  private readonly EXPIRY_DAYS = 30; // Password expires after 30 days

  /**
   * Generate a device-specific key using browser fingerprinting
   */
  private async generateDeviceKey(): Promise<CryptoKey> {
    // Collect device-specific data for fingerprinting
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      new Date().getTimezoneOffset().toString(),
      screen.width.toString(),
      screen.height.toString(),
      screen.colorDepth.toString(),
      // Add a random component that persists for this device
      this.getOrCreateDeviceId(),
    ].join("|");

    // Convert fingerprint to key material
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(fingerprint),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );

    // Derive encryption key
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("ai-lifestyle-secure-storage"),
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
   * Get or create a persistent device ID
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_KEY);

    if (!deviceId) {
      // Generate a random device ID
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      deviceId = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      localStorage.setItem(this.DEVICE_KEY, deviceId);
    }

    return deviceId;
  }

  /**
   * Store the master password securely
   */
  async storePassword(password: string): Promise<void> {
    try {
      // Generate device-specific key
      const deviceKey = await this.generateDeviceKey();

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt password
      const encoder = new TextEncoder();
      const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        deviceKey,
        encoder.encode(password),
      );

      // Prepare storage data
      const storageData = {
        encryptedPassword: this.arrayBufferToBase64(encryptedData),
        iv: this.arrayBufferToBase64(iv),
        expiresAt: Date.now() + this.EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        version: 1,
      };

      // Store in localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error("Failed to store password securely:", error);
      throw new Error("Failed to store password");
    }
  }

  /**
   * Retrieve the stored master password
   */
  async retrievePassword(): Promise<string | null> {
    try {
      // Get stored data
      const storedDataStr = localStorage.getItem(this.STORAGE_KEY);
      if (!storedDataStr) return null;

      const storedData = JSON.parse(storedDataStr);

      // Check expiration
      if (Date.now() > storedData.expiresAt) {
        this.clearStoredPassword();
        return null;
      }

      // Generate device-specific key
      const deviceKey = await this.generateDeviceKey();

      // Decrypt password
      const encryptedData = this.base64ToArrayBuffer(
        storedData.encryptedPassword,
      );
      const iv = this.base64ToArrayBuffer(storedData.iv);

      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        deviceKey,
        encryptedData,
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error("Failed to retrieve password:", error);
      // Clear corrupted data
      this.clearStoredPassword();
      return null;
    }
  }

  /**
   * Check if a password is stored
   */
  hasStoredPassword(): boolean {
    const storedDataStr = localStorage.getItem(this.STORAGE_KEY);
    if (!storedDataStr) return false;

    try {
      const storedData = JSON.parse(storedDataStr);
      return Date.now() <= storedData.expiresAt;
    } catch {
      return false;
    }
  }

  /**
   * Clear the stored password
   */
  clearStoredPassword(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Update expiration time (extend by another 30 days)
   */
  async extendExpiration(): Promise<void> {
    const password = await this.retrievePassword();
    if (password) {
      await this.storePassword(password);
    }
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
}

// Export singleton instance
export const securePasswordStorage = new SecurePasswordStorage();

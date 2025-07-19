/**
 * Session-based storage for encryption keys
 * Uses sessionStorage for temporary persistence within a browser session
 */

export class SessionStore {
  private static readonly SESSION_KEY = "ai-lifestyle-encryption-session";

  /**
   * Store encrypted session data
   * This data will be cleared when the browser tab is closed
   */
  static async storeSession(data: {
    masterKeyData: ArrayBuffer;
    timestamp: number;
    expiresAt: number;
  }): Promise<void> {
    try {
      // Convert ArrayBuffer to base64 for storage
      const base64Data = btoa(
        String.fromCharCode(...new Uint8Array(data.masterKeyData)),
      );

      const sessionData = {
        data: base64Data,
        timestamp: data.timestamp,
        expiresAt: data.expiresAt,
      };

      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error("Failed to store session data:", error);
    }
  }

  /**
   * Retrieve session data if valid
   */
  static async getSession(): Promise<ArrayBuffer | null> {
    try {
      const stored = sessionStorage.getItem(this.SESSION_KEY);
      if (!stored) return null;

      const sessionData = JSON.parse(stored);

      // Check if session has expired
      if (Date.now() > sessionData.expiresAt) {
        this.clearSession();
        return null;
      }

      // Convert base64 back to ArrayBuffer
      const binary = atob(sessionData.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return bytes.buffer;
    } catch (error) {
      console.error("Failed to retrieve session data:", error);
      return null;
    }
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Check if session exists and is valid
   */
  static hasValidSession(): boolean {
    try {
      const stored = sessionStorage.getItem(this.SESSION_KEY);
      if (!stored) return false;

      const sessionData = JSON.parse(stored);
      return Date.now() <= sessionData.expiresAt;
    } catch {
      return false;
    }
  }
}

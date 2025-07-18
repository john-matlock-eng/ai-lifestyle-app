import { getEncryptionService } from "@/services/encryption/EncryptionService";
import type { JournalEntry, SharedJournalsResponse } from "@/types/journal";
import journalApi from "@/api/journal";

export class JournalService {

  /**
   * Get a journal entry and decrypt if necessary
   */
  async getJournalEntry(entryId: string): Promise<JournalEntry> {
    const entry = await journalApi.getEntry(entryId);

    if (
      entry.isEncrypted &&
      entry.content &&
      entry.encryptedKey &&
      entry.encryptionIv
    ) {
      try {
        // For shared entries, the encryptedKey is already re-encrypted for us
        const decryptedContent = await getEncryptionService().tryDecryptWithFallback({
          content: entry.content,
          encryptedKey: entry.encryptedKey,
          iv: entry.encryptionIv,
        });

        return {
          ...entry,
          content: decryptedContent,
        };
      } catch (error) {
        console.error("Failed to decrypt journal content:", error);
        
        // Provide more specific error messages
        if (entry.shareAccess) {
          throw new Error(
            "Unable to decrypt shared content. The owner may need to re-share this entry with updated encryption.",
          );
        }
        
        if (error instanceof Error && error.message.includes("encryption keys are out of sync")) {
          throw error; // Pass through the detailed error message
        }
        
        throw new Error(
          "Unable to decrypt journal content. Please check your encryption setup in Settings > Security.",
        );
      }
    }

    return entry;
  }

  /**
   * List journal entries with optional filter
   */
  async listJournalEntries(params?: {
    page?: number;
    limit?: number;
    goalId?: string;
    filter?: "owned" | "shared-with-me" | "shared-by-me" | "all";
  }): Promise<SharedJournalsResponse> {
    const response = await journalApi.listEntries(params);

    // Don't decrypt entries in the list view - it's not needed
    // The JournalCard component will show a placeholder for encrypted content
    // Decryption happens only when viewing individual entries
    return response;
  }

  /**
   * Share a journal entry with another user
   */
  async shareJournal(
    entry: JournalEntry,
    recipientEmail: string,
    permissions: string[] = ["read"],
    expiresInHours: number = 24,
  ): Promise<{ shareId: string }> {
    if (!entry.isEncrypted || !entry.encryptedKey) {
      throw new Error("Can only share encrypted journals");
    }

    try {
      // Find recipient by email
      const recipientResponse = await fetch(
        `/api/users/by-email?email=${encodeURIComponent(recipientEmail)}`,
      );
      if (!recipientResponse.ok) {
        throw new Error("Recipient not found. Make sure they have an account and have set up encryption.");
      }
      const recipientData = await recipientResponse.json();

      // First, verify we can decrypt the content key (to ensure we can re-encrypt it)
      try {
        await getEncryptionService().tryDecryptWithFallback({
          content: entry.content,
          encryptedKey: entry.encryptedKey,
          iv: entry.encryptionIv!,
        });
      } catch (decryptError) {
        console.error("Cannot decrypt entry for sharing:", decryptError);
        throw new Error(
          "Unable to share this entry. The encryption keys may be out of sync. " +
          "Please try: \n" +
          "1. Resetting your encryption in Settings > Security\n" +
          "2. Re-saving this entry to update its encryption\n" +
          "3. Creating a new encrypted copy of this entry",
        );
      }

      // Share using the encryption service
      const { shareId } = await getEncryptionService().shareWithUser(
        "journal",
        entry.entryId,
        recipientData.userId,
        entry.encryptedKey,
        expiresInHours,
        permissions,
      );

      return { shareId };
    } catch (error) {
      if (error instanceof Error && 
          (error.message.includes("encryption keys may be out of sync") ||
           error.message.includes("Recipient not found"))) {
        throw error;
      }
      throw new Error(
        `Failed to share journal: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check if the current user can access a journal entry
   */
  canAccessEntry(entry: JournalEntry, currentUserId: string): boolean {
    // Owner can always access
    if (entry.userId === currentUserId) {
      return true;
    }

    // Check if shared via shareAccess (when accessing a shared journal)
    if (entry.shareAccess) {
      return true;
    }

    // Check if in sharedWith list (legacy check)
    if (entry.sharedWith.includes(currentUserId)) {
      return true;
    }

    return false;
  }

  /**
   * Check if the current user can edit a journal entry
   */
  canEditEntry(entry: JournalEntry, currentUserId: string): boolean {
    // Only owner can edit
    return entry.userId === currentUserId;
  }

  /**
   * Check if the current user can share a journal entry
   */
  canShareEntry(entry: JournalEntry, currentUserId: string): boolean {
    // Only owner can share
    return entry.userId === currentUserId;
  }

  /**
   * Re-encrypt a journal entry with current encryption keys
   */
  async reencryptEntry(entryId: string): Promise<JournalEntry> {
    try {
      // Get the entry
      const entry = await this.getJournalEntry(entryId);
      
      if (!entry.isEncrypted) {
        throw new Error("Entry is not encrypted");
      }
      
      // The content is already decrypted from getJournalEntry
      // Now re-encrypt with current keys
      const newEncryptedData = await getEncryptionService().encryptContent(
        entry.content,
      );
      
      // Update the entry with new encryption
      const updatedEntry = await journalApi.updateEntry(entryId, {
        content: newEncryptedData.content,
        encryptedKey: newEncryptedData.encryptedKey,
        encryptionIv: newEncryptedData.iv,
        wordCount: entry.wordCount, // Preserve word count
        isEncrypted: true,
      });
      
      console.log("[Journal] Successfully re-encrypted entry", entryId);
      
      return updatedEntry;
    } catch (error) {
      console.error("[Journal] Failed to re-encrypt entry", entryId, error);
      throw new Error(
        `Failed to re-encrypt entry: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

// Singleton instance
let journalService: JournalService | null = null;

export function getJournalService(): JournalService {
  if (!journalService) {
    journalService = new JournalService();
  }
  return journalService;
}

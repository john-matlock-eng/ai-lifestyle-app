import { getEncryptionService } from '@/services/encryption/EncryptionService';
import type { 
  JournalEntry, 
  SharedJournalsResponse 
} from '@/types/journal';
import journalApi from '@/api/journal';

export class JournalService {
  private encryptionService = getEncryptionService();

  /**
   * Get a journal entry and decrypt if necessary
   */
  async getJournalEntry(entryId: string): Promise<JournalEntry> {
    const entry = await journalApi.getEntry(entryId);
    
    if (entry.isEncrypted && entry.content && entry.encryptedKey && entry.encryptionIv) {
      try {
        // For shared entries, the encryptedKey is already re-encrypted for us
        const decryptedContent = await this.encryptionService.decryptContent({
          content: entry.content,
          encryptedKey: entry.encryptedKey,
          iv: entry.encryptionIv
        });
        
        return {
          ...entry,
          content: decryptedContent
        };
      } catch (error) {
        console.error('Failed to decrypt journal content:', error);
        throw new Error('Unable to decrypt journal content. Please check your encryption setup.');
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
    filter?: 'owned' | 'shared-with-me' | 'shared-by-me' | 'all';
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
    permissions: string[] = ['read'],
    expiresInHours: number = 24
  ): Promise<{ shareId: string }> {
    if (!entry.isEncrypted || !entry.encryptedKey) {
      throw new Error('Can only share encrypted journals');
    }

    // Find recipient by email
    const recipientResponse = await fetch(`/api/users/by-email?email=${encodeURIComponent(recipientEmail)}`);
    if (!recipientResponse.ok) {
      throw new Error('Recipient not found');
    }
    const recipientData = await recipientResponse.json();

    // Share using the encryption service
    const { shareId } = await this.encryptionService.shareWithUser(
      'journal',
      entry.entryId,
      recipientData.userId,
      entry.encryptedKey,
      expiresInHours,
      permissions
    );

    return { shareId };
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
}

// Singleton instance
let journalService: JournalService | null = null;

export function getJournalService(): JournalService {
  if (!journalService) {
    journalService = new JournalService();
  }
  return journalService;
}
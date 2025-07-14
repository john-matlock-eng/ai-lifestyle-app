import type { JournalEntry } from '../../../types/journal';
import { getEncryptionService } from '@/services/encryption';
import { shouldTreatAsEncrypted } from '@/utils/encryption-utils';

const DB_NAME = 'ai-lifestyle-journal';
const STORE_NAME = 'journal-entries';
const DECRYPTED_STORE_NAME = 'decrypted-entries';
const SETTINGS_STORE_NAME = 'journal-settings';
const DB_VERSION = 3;

export interface SearchFilters {
  query?: string;
  tags?: string[];
  template?: string;
  mood?: string;
  startDate?: Date;
  endDate?: Date;
  isEncrypted?: boolean;
}

export interface SearchResult {
  entries: JournalEntry[];
  total: number;
}

export interface JournalSettings {
  cacheDecryptedContent: boolean;
  lastCacheUpdate?: string;
}

interface DecryptedEntry {
  entryId: string;
  content: string;
  decryptedAt: string;
}

class JournalStorageService {
  private db: IDBDatabase | null = null;
  private settings: JournalSettings = {
    cacheDecryptedContent: false
  };

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create journal entries store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'entryId' });
          
          // Create indexes for efficient searching
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('template', 'template', { unique: false });
          store.createIndex('mood', 'mood', { unique: false });
          store.createIndex('isEncrypted', 'isEncrypted', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
        
        // Create decrypted content store if it doesn't exist
        if (!db.objectStoreNames.contains(DECRYPTED_STORE_NAME)) {
          const decryptedStore = db.createObjectStore(DECRYPTED_STORE_NAME, { keyPath: 'entryId' });
          decryptedStore.createIndex('decryptedAt', 'decryptedAt', { unique: false });
        }
        
        // Create settings store if it doesn't exist
        if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
          db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = async () => {
        this.db = request.result;
        // Load settings
        await this.loadSettings();
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  private async loadSettings(): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve) => {
      const tx = db.transaction(SETTINGS_STORE_NAME, 'readonly');
      const store = tx.objectStore(SETTINGS_STORE_NAME);
      const request = store.get('journal-settings');
      
      request.onsuccess = () => {
        if (request.result) {
          this.settings = request.result.settings;
        }
        resolve();
      };
      
      request.onerror = () => resolve(); // Use defaults on error
    });
  }

  async updateSettings(settings: Partial<JournalSettings>): Promise<void> {
    const db = await this.ensureDb();
    this.settings = { ...this.settings, ...settings };
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(SETTINGS_STORE_NAME);
      const request = store.put({ id: 'journal-settings', settings: this.settings });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSettings(): Promise<JournalSettings> {
    return { ...this.settings };
  }

  async saveEntry(entry: JournalEntry, decryptForCache = true): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, DECRYPTED_STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // Save the entry
      store.put(entry);
      
      // If caching is enabled and entry is encrypted, cache decrypted content
      if (this.settings.cacheDecryptedContent && decryptForCache && shouldTreatAsEncrypted(entry)) {
        this.cacheDecryptedContent(entry, tx).catch(error => {
          console.warn('Failed to cache decrypted content:', error);
          // Don't fail the save operation if caching fails
        });
      }
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async cacheDecryptedContent(entry: JournalEntry, transaction?: IDBTransaction): Promise<void> {
    if (!shouldTreatAsEncrypted(entry) || !entry.encryptedKey) {
      return;
    }

    try {
      const encryptionService = getEncryptionService();
      const decryptedContent = await encryptionService.decryptContent({
        content: entry.content,
        encryptedKey: entry.encryptedKey,
        iv: entry.encryptionIv!,
      });

      const decryptedEntry: DecryptedEntry = {
        entryId: entry.entryId,
        content: decryptedContent,
        decryptedAt: new Date().toISOString()
      };

      if (transaction) {
        const decryptedStore = transaction.objectStore(DECRYPTED_STORE_NAME);
        decryptedStore.put(decryptedEntry);
      } else {
        const db = await this.ensureDb();
        const tx = db.transaction(DECRYPTED_STORE_NAME, 'readwrite');
        const store = tx.objectStore(DECRYPTED_STORE_NAME);
        store.put(decryptedEntry);
      }
    } catch (error) {
      console.error('Failed to decrypt content for caching:', error);
      throw error;
    }
  }

  async clearDecryptedCache(): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DECRYPTED_STORE_NAME, 'readwrite');
      const store = tx.objectStore(DECRYPTED_STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeDecryptedEntry(entryId: string): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DECRYPTED_STORE_NAME, 'readwrite');
      const store = tx.objectStore(DECRYPTED_STORE_NAME);
      const request = store.delete(entryId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getDecryptedContent(entryId: string): Promise<string | null> {
    if (!this.settings.cacheDecryptedContent) {
      return null;
    }

    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DECRYPTED_STORE_NAME, 'readonly');
      const store = tx.objectStore(DECRYPTED_STORE_NAME);
      const request = store.get(entryId);
      
      request.onsuccess = () => {
        const result = request.result as DecryptedEntry | undefined;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveEntries(entries: JournalEntry[]): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, DECRYPTED_STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      for (const entry of entries) {
        store.put(entry);
        
        // Cache decrypted content if enabled
        if (this.settings.cacheDecryptedContent && shouldTreatAsEncrypted(entry)) {
          this.cacheDecryptedContent(entry, tx).catch(error => {
            console.warn(`Failed to cache decrypted content for entry ${entry.entryId}:`, error);
          });
        }
      }
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getEntry(entryId: string): Promise<JournalEntry | null> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(entryId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEntry(entryId: string): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, DECRYPTED_STORE_NAME], 'readwrite');
      
      // Delete from both stores
      const journalStore = tx.objectStore(STORE_NAME);
      journalStore.delete(entryId);
      
      const decryptedStore = tx.objectStore(DECRYPTED_STORE_NAME);
      decryptedStore.delete(entryId);
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllEntries(): Promise<JournalEntry[]> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async searchEntries(filters: SearchFilters): Promise<SearchResult> {
    await this.ensureDb();
    const allEntries = await this.getAllEntries();
    
    let filteredEntries = [...allEntries];
    
    // Apply search query (full-text search on title and content)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const searchPromises = filteredEntries.map(async (entry) => {
        // Always search title
        if (entry.title.toLowerCase().includes(query)) {
          return entry;
        }
        
        // For encrypted entries, try to search decrypted content if cached
        if (entry.isEncrypted) {
          const decryptedContent = await this.getDecryptedContent(entry.entryId);
          if (decryptedContent && decryptedContent.toLowerCase().includes(query)) {
            return entry;
          }
          return null;
        }
        
        // For unencrypted entries, search content directly
        if (entry.content.toLowerCase().includes(query)) {
          return entry;
        }
        
        return null;
      });
      
      const searchResults = await Promise.all(searchPromises);
      filteredEntries = searchResults.filter((entry): entry is JournalEntry => entry !== null);
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filteredEntries = filteredEntries.filter(entry =>
        filters.tags!.some(tag => entry.tags.includes(tag))
      );
    }
    
    // Filter by template
    if (filters.template) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.template === filters.template
      );
    }
    
    // Filter by mood
    if (filters.mood) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.mood === filters.mood
      );
    }
    
    // Filter by date range
    if (filters.startDate || filters.endDate) {
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        
        if (filters.startDate && entryDate < filters.startDate) {
          return false;
        }
        
        if (filters.endDate) {
          // Include entries up to the end of the endDate
          const endOfDay = new Date(filters.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (entryDate > endOfDay) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // Filter by encryption status
    if (filters.isEncrypted !== undefined) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.isEncrypted === filters.isEncrypted
      );
    }
    
    // Sort by most recent first
    filteredEntries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return {
      entries: filteredEntries,
      total: filteredEntries.length
    };
  }

  async getUniqueValues(field: 'tags' | 'mood' | 'template'): Promise<string[]> {
    const entries = await this.getAllEntries();
    const values = new Set<string>();
    
    entries.forEach(entry => {
      if (field === 'tags') {
        entry.tags.forEach(tag => values.add(tag));
      } else if (field === 'mood' && entry.mood) {
        values.add(entry.mood);
      } else if (field === 'template') {
        values.add(entry.template);
      }
    });
    
    return Array.from(values).sort();
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, DECRYPTED_STORE_NAME], 'readwrite');
      
      const journalStore = tx.objectStore(STORE_NAME);
      journalStore.clear();
      
      const decryptedStore = tx.objectStore(DECRYPTED_STORE_NAME);
      decryptedStore.clear();
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async syncWithServer(serverEntries: JournalEntry[]): Promise<void> {
    // Clear existing entries and save new ones
    await this.clearAll();
    await this.saveEntries(serverEntries);
  }

  async rebuildDecryptedCache(): Promise<void> {
    if (!this.settings.cacheDecryptedContent) {
      return;
    }

    const entries = await this.getAllEntries();
    const encryptedEntries = entries.filter(shouldTreatAsEncrypted);
    
    console.log(`Rebuilding decrypted cache for ${encryptedEntries.length} encrypted entries...`);
    
    for (const entry of encryptedEntries) {
      try {
        await this.cacheDecryptedContent(entry);
      } catch (error) {
        console.error(`Failed to cache entry ${entry.entryId}:`, error);
      }
    }
    
    await this.updateSettings({ lastCacheUpdate: new Date().toISOString() });
    console.log('Decrypted cache rebuild complete');
  }

  async getCacheStats(): Promise<{
    totalEntries: number;
    encryptedEntries: number;
    cachedEntries: number;
    cacheEnabled: boolean;
    lastCacheUpdate?: string;
  }> {
    const db = await this.ensureDb();
    const entries = await this.getAllEntries();
    
    const encryptedEntries = entries.filter(shouldTreatAsEncrypted);
    
    // Count cached entries
    const cachedCount = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(DECRYPTED_STORE_NAME, 'readonly');
      const store = tx.objectStore(DECRYPTED_STORE_NAME);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return {
      totalEntries: entries.length,
      encryptedEntries: encryptedEntries.length,
      cachedEntries: cachedCount,
      cacheEnabled: this.settings.cacheDecryptedContent,
      lastCacheUpdate: this.settings.lastCacheUpdate
    };
  }
}

export const journalStorage = new JournalStorageService();
import type { JournalEntry } from '../../../types/journal';

const DB_NAME = 'ai-lifestyle-journal';
const STORE_NAME = 'journal-entries';
const DB_VERSION = 2;

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

class JournalStorageService {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Delete old store if it exists
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        
        // Create new store with indexes for search
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'entryId' });
        
        // Create indexes for efficient searching
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('template', 'template', { unique: false });
        store.createIndex('mood', 'mood', { unique: false });
        store.createIndex('isEncrypted', 'isEncrypted', { unique: false });
        store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      };
      
      request.onsuccess = () => {
        this.db = request.result;
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

  async saveEntry(entry: JournalEntry): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(entry);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveEntries(entries: JournalEntry[]): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      entries.forEach(entry => {
        store.put(entry);
      });
      
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
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(entryId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
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
      filteredEntries = filteredEntries.filter(entry => {
        // For encrypted entries, only search title
        if (entry.isEncrypted) {
          return entry.title.toLowerCase().includes(query);
        }
        // For unencrypted entries, search both title and content
        return (
          entry.title.toLowerCase().includes(query) ||
          entry.content.toLowerCase().includes(query)
        );
      });
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
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async syncWithServer(serverEntries: JournalEntry[]): Promise<void> {
    // Clear existing entries and save new ones
    await this.clearAll();
    await this.saveEntries(serverEntries);
  }
}

export const journalStorage = new JournalStorageService();
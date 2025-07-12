/**
 * IndexedDB wrapper for secure key storage
 * This is a simplified implementation that uses native IndexedDB
 * In production, consider using the 'idb' library for better type safety
 */

interface KeyData {
  type: 'salt' | 'personal' | 'content';
  data: ArrayBuffer | string;
  metadata?: {
    created?: number;
    algorithm?: string;
    publicKeyId?: string;
    publicKey?: string;
    [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
}

class KeyStore {
  private dbName = 'ai-lifestyle-encryption';
  private version = 1;

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create key store
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys');
        }
        
        // Create cache store
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
      };
    });
  }

  async getSalt(): Promise<Uint8Array | null> {
    const db = await this.openDB();
    const transaction = db.transaction(['keys'], 'readonly');
    const store = transaction.objectStore('keys');
    
    return new Promise((resolve, reject) => {
      const request = store.get('master-salt');
      request.onsuccess = () => {
        const result = request.result as KeyData | undefined;
        resolve(result ? new Uint8Array(result.data as ArrayBuffer) : null);
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async setSalt(salt: Uint8Array): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['keys'], 'readwrite');
    const store = transaction.objectStore('keys');
    
    const data: KeyData = {
      type: 'salt',
      data: salt.buffer,
      metadata: { created: Date.now() }
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(data, 'master-salt');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async getPersonalKeys(): Promise<{
    privateKey: ArrayBuffer;
    publicKey: string;
    publicKeyId: string;
  } | null> {
    const db = await this.openDB();
    const transaction = db.transaction(['keys'], 'readonly');
    const store = transaction.objectStore('keys');
    
    return new Promise((resolve, reject) => {
      const request = store.get('personal-keys');
      request.onsuccess = () => {
        const result = request.result as KeyData | undefined;
        if (!result || result.type !== 'personal') {
          resolve(null);
        } else {
          resolve({
            privateKey: result.data as ArrayBuffer,
            publicKey: result.metadata?.publicKey as string,
            publicKeyId: result.metadata?.publicKeyId as string,
          });
        }
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async setPersonalKeys(
    encryptedPrivateKey: ArrayBuffer,
    publicKey: string,
    publicKeyId: string
  ): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['keys'], 'readwrite');
    const store = transaction.objectStore('keys');
    
    const data: KeyData = {
      type: 'personal',
      data: encryptedPrivateKey,
      metadata: {
        publicKey,
        publicKeyId,
        created: Date.now(),
        algorithm: 'RSA-OAEP'
      }
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(data, 'personal-keys');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async getContentKey(entryId: string): Promise<ArrayBuffer | null> {
    const db = await this.openDB();
    const transaction = db.transaction(['keys'], 'readonly');
    const store = transaction.objectStore('keys');
    
    return new Promise((resolve, reject) => {
      const request = store.get(`content-${entryId}`);
      request.onsuccess = () => {
        const result = request.result as KeyData | undefined;
        resolve(result ? result.data as ArrayBuffer : null);
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async setContentKey(entryId: string, key: ArrayBuffer): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['keys'], 'readwrite');
    const store = transaction.objectStore('keys');
    
    const data: KeyData = {
      type: 'content',
      data: key,
      metadata: { created: Date.now() }
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(data, `content-${entryId}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['keys', 'cache'], 'readwrite');
    
    return new Promise((resolve, reject) => {
      const keysRequest = transaction.objectStore('keys').clear();
      const cacheRequest = transaction.objectStore('cache').clear();
      
      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) resolve();
      };
      
      keysRequest.onsuccess = checkComplete;
      cacheRequest.onsuccess = checkComplete;
      
      keysRequest.onerror = () => reject(keysRequest.error);
      cacheRequest.onerror = () => reject(cacheRequest.error);
      
      transaction.oncomplete = () => db.close();
    });
  }
}

export const keyStore = new KeyStore();
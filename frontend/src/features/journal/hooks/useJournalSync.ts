// useJournalSync.ts
import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listEntries } from '@/api/journal';
import { journalStorage } from '../services/JournalStorageService';
import type { SharedJournalsResponse, JournalEntry } from '@/types/journal';

interface UseJournalSyncOptions {
  enabled?: boolean;
  syncInterval?: number;
}

export function useJournalSync(options: UseJournalSyncOptions = {}) {
  const { enabled = true, syncInterval = 5 * 60 * 1000 } = options; // 5 minutes default
  const queryClient = useQueryClient();

  // Fetch all entries from server
  const { data, isLoading, error, refetch } = useQuery<SharedJournalsResponse>({
    queryKey: ['journal-sync'],
    queryFn: () => listEntries({ limit: 1000 }), // Fetch all entries
    enabled,
    staleTime: syncInterval,
    refetchInterval: syncInterval,
  });

  // Sync with IndexedDB when data changes
  useEffect(() => {
    if (data?.entries && !isLoading) {
      syncToLocalStorage();
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncToLocalStorage = useCallback(async () => {
    if (!data?.entries) return;

    try {
      // Extract JournalEntry objects from the response
      const journalEntries = data.entries.map(item => 
        'entry' in item ? item.entry : item
      ) as JournalEntry[];
      
      console.log(`Syncing ${journalEntries.length} journal entries to local storage...`);
      
      // Sync all entries
      await journalStorage.syncWithServer(journalEntries);
      
      // Check if we should rebuild the decrypted cache
      const settings = await journalStorage.getSettings();
      if (settings.cacheDecryptedContent) {
        const stats = await journalStorage.getCacheStats();
        if (stats.encryptedEntries > stats.cachedEntries) {
          console.log('Rebuilding decrypted cache for new encrypted entries...');
          await journalStorage.rebuildDecryptedCache();
        }
      }
      
      // Invalidate search queries to reflect new data
      queryClient.invalidateQueries({ queryKey: ['journal-search'] });
      
      console.log('Journal sync completed');
    } catch (error) {
      console.error('Failed to sync journal entries:', error);
    }
  }, [data, queryClient]);

  const forceSync = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const enableDecryptedCache = useCallback(async (enable: boolean) => {
    await journalStorage.updateSettings({ cacheDecryptedContent: enable });
    
    if (enable) {
      // Rebuild cache when enabling
      await journalStorage.rebuildDecryptedCache();
    } else {
      // Clear cache when disabling
      await journalStorage.clearDecryptedCache();
    }
    
    // Invalidate search queries
    queryClient.invalidateQueries({ queryKey: ['journal-search'] });
  }, [queryClient]);

  const getCacheStats = useCallback(async () => {
    return await journalStorage.getCacheStats();
  }, []);

  return {
    isLoading,
    error,
    lastSync: data ? new Date() : null,
    forceSync,
    enableDecryptedCache,
    getCacheStats,
    totalEntries: data?.total || 0,
  };
}
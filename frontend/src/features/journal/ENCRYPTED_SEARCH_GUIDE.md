# Encrypted Journal Search Implementation

## Overview

I've implemented a secure local caching system for encrypted journal entries that enables full-text search while maintaining privacy. Here's how to use it:

## Key Features

1. **Optional Encrypted Content Caching**: Users can enable/disable caching of decrypted content for search
2. **Local Storage Only**: All cached data stays in the browser's IndexedDB
3. **Automatic Sync**: Journal entries sync with the server and maintain the cache
4. **Privacy Controls**: Users have full control over the cache

## How to Use

### 1. Enable Journal Sync in Your App

Add the journal sync hook to your main journal page or app component:

```tsx
import { useJournalSync } from '@/features/journal/hooks';

function JournalPage() {
  // Initialize journal sync
  const { isLoading, forceSync } = useJournalSync({
    enabled: true,
    syncInterval: 5 * 60 * 1000 // 5 minutes
  });

  // Your journal UI...
}
```

### 2. Search Settings UI

The search bar now includes a settings button (gear icon) that opens the search settings dialog where users can:

- Enable/disable encrypted content caching
- View cache statistics
- Rebuild the cache for missing entries
- Clear the cache

### 3. Search Functionality

The search automatically uses cached decrypted content when available:

```tsx
import { useJournalSearch } from '@/features/journal/hooks';

function JournalSearchResults() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const { results, isSearching } = useJournalSearch(filters);
  
  // Results will include encrypted entries if their cached content matches
}
```

## Security Considerations

1. **Local Only**: Cached content never leaves the device
2. **Browser Security**: IndexedDB is encrypted at rest by the browser
3. **User Control**: Users can disable caching at any time
4. **Clear on Logout**: Consider clearing the cache when users log out:

```tsx
import { journalStorage } from '@/features/journal/services/JournalStorageService';

async function handleLogout() {
  // Clear all journal data including cache
  await journalStorage.clearAll();
  // ... rest of logout logic
}
```

## API Reference

### JournalStorageService

```typescript
// Enable/disable caching
await journalStorage.updateSettings({ cacheDecryptedContent: true });

// Get cache statistics
const stats = await journalStorage.getCacheStats();
// Returns: { totalEntries, encryptedEntries, cachedEntries, cacheEnabled, lastCacheUpdate }

// Rebuild cache for all encrypted entries
await journalStorage.rebuildDecryptedCache();

// Clear only the decrypted cache
await journalStorage.clearDecryptedCache();

// Clear everything
await journalStorage.clearAll();
```

### useJournalSync Hook

```typescript
const {
  isLoading,         // Is syncing with server
  error,            // Sync error if any
  lastSync,         // Date of last successful sync
  forceSync,        // Function to force a sync
  enableDecryptedCache, // Function to enable/disable cache
  getCacheStats,    // Function to get cache statistics
  totalEntries      // Total number of entries
} = useJournalSync(options);
```

## Performance Notes

1. **Initial Cache Build**: When first enabling, rebuilding the cache may take time depending on the number of encrypted entries
2. **Search Performance**: Searching encrypted entries is now as fast as unencrypted ones when cached
3. **Storage Usage**: Each cached entry uses additional IndexedDB storage

## Privacy Best Practices

1. **Inform Users**: Make sure users understand that enabling search caching stores decrypted content locally
2. **Default Off**: The feature is disabled by default for maximum privacy
3. **Clear on Sensitive Actions**: Consider clearing the cache when users perform sensitive actions
4. **Session Management**: You might want to clear the cache after a period of inactivity

## Example Integration

Here's a complete example of integrating the search with settings:

```tsx
import React, { useEffect } from 'react';
import { 
  JournalSearchBar, 
  JournalCard, 
  SearchResultsSummary 
} from '@/features/journal/components';
import { useJournalSearch, useJournalSync } from '@/features/journal/hooks';

export function JournalSearchPage() {
  // Initialize sync
  const { isLoading: isSyncing } = useJournalSync({ enabled: true });
  
  // Search state
  const [filters, setFilters] = useState<SearchFilters>({});
  const { results, isSearching, uniqueValues } = useJournalSearch(filters);
  
  if (isSyncing && !results) {
    return <div>Syncing journal entries...</div>;
  }
  
  return (
    <div>
      <JournalSearchBar
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={uniqueValues.tags}
        availableMoods={uniqueValues.moods}
        availableTemplates={uniqueValues.templates}
      />
      
      <SearchResultsSummary 
        total={results.total}
        isSearching={isSearching}
      />
      
      <div className="grid gap-4">
        {results.entries.map(entry => (
          <JournalCard 
            key={entry.entryId} 
            entry={entry}
            onClick={() => navigate(`/journal/${entry.entryId}`)}
          />
        ))}
      </div>
    </div>
  );
}
```

## Troubleshooting

1. **Search not finding encrypted entries**: Make sure caching is enabled in settings
2. **Cache rebuild fails**: Ensure encryption keys are properly set up
3. **Storage quota exceeded**: Clear browser data or reduce the number of cached entries

## Future Enhancements

Consider these potential improvements:

1. **Selective Caching**: Allow users to choose which entries to cache
2. **Cache Expiry**: Automatically clear old cached entries
3. **Search Highlighting**: Highlight search terms in results
4. **Background Sync**: Use service workers for background syncing
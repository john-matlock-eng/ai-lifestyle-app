import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { debounce } from '../../../utils/debounce';
import { journalStorage } from '../services/JournalStorageService';
import type { SearchFilters, SearchResult } from '../services/JournalStorageService';
import { listEntries } from '../../../api/journal';
import type { JournalEntry } from '../../../types/journal';

interface UseJournalSearchOptions {
  limit?: number;
  debounceMs?: number;
}

interface UseJournalSearchResult {
  // Search results
  entries: JournalEntry[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  
  // Search filters
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  
  // Filter options
  availableTags: string[];
  availableMoods: string[];
  availableTemplates: string[];
  
  // Pagination
  page: number;
  setPage: (page: number) => void;
  hasMore: boolean;
}

export function useJournalSearch(options: UseJournalSearchOptions = {}): UseJournalSearchResult {
  const { limit = 12, debounceMs = 300 } = options;
  
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchResult, setSearchResult] = useState<SearchResult>({ entries: [], total: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);
  
  // Initialize storage on mount
  useEffect(() => {
    journalStorage.initialize().catch(console.error);
  }, []);
  
  // Fetch entries from server and sync to local storage
  const { data: serverData, isLoading: isLoadingServer, error: serverError } = useQuery({
    queryKey: ['journal', 'entries', 'all'],
    queryFn: async () => {
      // Fetch all entries for local caching (up to 1000)
      const response = await listEntries({ page: 1, limit: 1000 });
      
      // Extract JournalEntry objects from the response
      const journalEntries = response.entries.map(item => 
        'entry' in item ? item.entry : item
      );
      
      // Sync with local storage
      await journalStorage.syncWithServer(journalEntries);
      
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Get available filter options
  const { data: availableTags = [] } = useQuery({
    queryKey: ['journal', 'tags'],
    queryFn: () => journalStorage.getUniqueValues('tags'),
    enabled: !!serverData,
  });
  
  const { data: availableMoods = [] } = useQuery({
    queryKey: ['journal', 'moods'],
    queryFn: () => journalStorage.getUniqueValues('mood'),
    enabled: !!serverData,
  });
  
  const { data: availableTemplates = [] } = useQuery({
    queryKey: ['journal', 'templates'],
    queryFn: () => journalStorage.getUniqueValues('template'),
    enabled: !!serverData,
  });
  
  // Debounced search function
  const performSearch = useCallback(
    async (searchFilters: SearchFilters) => {
      setIsSearching(true);
      setSearchError(null);
      
      try {
        const result = await journalStorage.searchEntries(searchFilters);
        setSearchResult(result);
      } catch (error) {
        setSearchError(error as Error);
        setSearchResult({ entries: [], total: 0 });
      } finally {
        setIsSearching(false);
      }
    },
    []
  );
  
  // Debounce search for text query
  const debouncedSearch = useMemo(
    () => debounce(performSearch as (...args: unknown[]) => unknown, debounceMs),
    [performSearch, debounceMs]
  );
  
  // Trigger search when filters change
  useEffect(() => {
    if (serverData) {
      // Use debounced search for text query, immediate search for other filters
      if (filters.query !== undefined) {
        debouncedSearch(filters);
      } else {
        performSearch(filters);
      }
    }
  }, [filters, serverData, debouncedSearch, performSearch]);
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);
  
  // Calculate paginated results
  const paginatedEntries = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return searchResult.entries.slice(startIndex, endIndex);
  }, [searchResult.entries, page, limit]);
  
  const hasMore = page * limit < searchResult.total;
  
  return {
    entries: paginatedEntries,
    total: searchResult.total,
    isLoading: isLoadingServer || isSearching,
    error: serverError || searchError,
    
    filters,
    setFilters,
    
    availableTags,
    availableMoods,
    availableTemplates,
    
    page,
    setPage,
    hasMore,
  };
}
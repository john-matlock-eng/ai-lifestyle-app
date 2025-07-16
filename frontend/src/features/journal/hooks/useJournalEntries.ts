// useJournalEntries.ts
import { useQuery } from '@tanstack/react-query';
import { getJournalService } from '../services/journal-service';
import type { SharedJournalsResponse } from '@/types/journal';

interface UseJournalEntriesParams {
  page?: number;
  limit?: number;
  goalId?: string;
  filter?: 'owned' | 'shared-with-me' | 'shared-by-me' | 'all';
}

export function useJournalEntries(params?: UseJournalEntriesParams) {
  const journalService = getJournalService();
  
  return useQuery<SharedJournalsResponse>({
    queryKey: ['journal-entries', params],
    queryFn: () => journalService.listJournalEntries(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
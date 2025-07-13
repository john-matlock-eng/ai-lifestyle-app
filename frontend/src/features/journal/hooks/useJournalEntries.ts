// useJournalEntries.ts
import { useQuery } from '@tanstack/react-query';
import { listEntries } from '@/api/journal';
import type { JournalListResponse } from '@/types/journal';

interface UseJournalEntriesParams {
  page?: number;
  limit?: number;
  goalId?: string;
}

export function useJournalEntries(params?: UseJournalEntriesParams) {
  return useQuery<JournalListResponse>({
    queryKey: ['journal-entries', params],
    queryFn: () => listEntries(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
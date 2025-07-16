// useJournalEntry.ts
import { useQuery } from '@tanstack/react-query';
import { getJournalService } from '../services/journal-service';
import type { JournalEntry } from '@/types/journal';

export function useJournalEntry(entryId: string | undefined) {
  const journalService = getJournalService();
  
  return useQuery<JournalEntry>({
    queryKey: ['journal-entry', entryId],
    queryFn: () => journalService.getJournalEntry(entryId!),
    enabled: !!entryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
// useShareJournal.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getJournalService } from '../services/journal-service';
import type { JournalEntry } from '@/types/journal';

interface ShareJournalParams {
  entry: JournalEntry;
  recipientEmail: string;
  permissions?: string[];
  expiresInHours?: number;
}

export function useShareJournal() {
  const queryClient = useQueryClient();
  const journalService = getJournalService();
  
  return useMutation({
    mutationFn: ({ entry, recipientEmail, permissions, expiresInHours }: ShareJournalParams) =>
      journalService.shareJournal(entry, recipientEmail, permissions, expiresInHours),
    onSuccess: (data, variables) => {
      // Invalidate journal entries to refresh the shared status
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry', variables.entry.entryId] });
    },
  });
}
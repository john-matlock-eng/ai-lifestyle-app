// useReencryptEntry.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getJournalService } from "../services/journal-service";
import type { JournalEntry } from "@/types/journal";

interface UseReencryptEntryOptions {
  onSuccess?: (entry: JournalEntry) => void;
  onError?: (error: Error) => void;
}

export function useReencryptEntry(options?: UseReencryptEntryOptions) {
  const queryClient = useQueryClient();
  const journalService = getJournalService();

  return useMutation({
    mutationFn: (entryId: string) => journalService.reencryptEntry(entryId),
    onSuccess: (updatedEntry) => {
      // Update the cache with the re-encrypted entry
      queryClient.setQueryData(
        ["journal-entry", updatedEntry.entryId],
        updatedEntry
      );
      
      // Invalidate the list to show updated encryption status
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      
      options?.onSuccess?.(updatedEntry);
    },
    onError: (error) => {
      console.error("Failed to re-encrypt entry:", error);
      options?.onError?.(error as Error);
    },
  });
}

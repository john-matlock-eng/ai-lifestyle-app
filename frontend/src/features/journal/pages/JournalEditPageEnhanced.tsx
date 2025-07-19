// JournalEditPageEnhanced.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/common";
import { getEntry, updateEntry } from "@/api/journal";
import { journalStorage } from "../services/JournalStorageService";
import { EnhancedJournalEditor } from "../components/EnhancedEditor";
import type { UpdateJournalEntryRequest } from "@/types/journal";

export const JournalEditPageEnhanced: React.FC = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  // Fetch entry
  const {
    data: entry,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["journal", "entry", entryId],
    queryFn: () => getEntry(entryId!),
    enabled: !!entryId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (request: UpdateJournalEntryRequest) =>
      updateEntry(entryId!, request),
    onSuccess: async (data) => {
      // Update IndexedDB for search
      await journalStorage.saveEntry(data);
      navigate(`/journal/${data.entryId}`);
    },
  });

  // Initialize storage
  useEffect(() => {
    journalStorage.initialize().then(() => setIsReady(true));
  }, []);

  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted mt-4">Loading journal entry...</p>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">
            <p className="text-error mb-4">Failed to load journal entry</p>
            <Button onClick={() => navigate("/journal")}>
              Back to Journals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/journal/${entryId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel Edit
          </Button>
          <h1 className="text-3xl font-bold text-theme">Edit Journal Entry</h1>
        </div>

        {/* Editor */}
        <EnhancedJournalEditor
          templateId={entry.template}
          entry={entry}
          onSave={async (request) => {
            await updateMutation.mutateAsync(request);
          }}
          onCancel={() => navigate(`/journal/${entryId}`)}
          autoSave={true}
          showEncryption={true}
        />
      </div>
    </div>
  );
};

export default JournalEditPageEnhanced;

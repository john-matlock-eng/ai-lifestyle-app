// JournalImportPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/common";
import { JournalImporter } from "../components/JournalImporter";
import { createEntry } from "@/api/journal";
import { journalStorage } from "../services/JournalStorageService";
import { useEncryption } from "@/contexts/useEncryption";
import type { CreateJournalEntryRequest } from "@/types/journal";

export const JournalImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { isEncryptionSetup } = useEncryption();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: async (data) => {
      // Save to IndexedDB for search
      await journalStorage.saveEntry(data);
      // Navigate to the new entry
      navigate(`/journal/${data.entryId}`);
    },
    onError: (error) => {
      console.error("Failed to import journal entry:", error);
      // You might want to show an error toast here
    },
  });

  const handleImport = async (importData: CreateJournalEntryRequest) => {
    setIsSubmitting(true);

    try {
      // Note: Encryption should be handled at the API layer if needed
      await createMutation.mutateAsync(importData);
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/journal")}
          className="mb-6"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Journal
        </Button>

        {/* Import Component */}
        <JournalImporter
          onImport={handleImport}
          onCancel={() => navigate("/journal")}
          isEncryptionEnabled={isEncryptionSetup}
        />
      </div>
    </div>
  );
};

export default JournalImportPage;

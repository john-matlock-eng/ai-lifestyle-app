// useJournalDraft.ts
import { useState, useEffect, useCallback } from "react";
import type { JournalDraft } from "../types/enhanced-template.types";
import { purgeOldDrafts } from "../utils/drafts";

const DRAFT_KEY_PREFIX = "journal-draft-";
const DRAFT_LIST_KEY = "journal-drafts-list";

export interface UseJournalDraftOptions {
  templateId: string;
  entryId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function useJournalDraft({
  templateId,
  entryId,
  autoSave = true,
  autoSaveDelay = 5000,
}: UseJournalDraftOptions) {
  // Use a stable draft key based on entryId or templateId (without timestamp)
  const draftKey = `${DRAFT_KEY_PREFIX}${entryId || `new-${templateId}`}`;
  const [draft, setDraft] = useState<JournalDraft | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Clean old drafts on mount (once per session)
  useEffect(() => {
    // Only run cleanup once per session
    const cleanupKey = "journal-draft-cleanup-" + new Date().toDateString();
    if (!sessionStorage.getItem(cleanupKey)) {
      console.log("[useJournalDraft] Running draft cleanup...");
      purgeOldDrafts(14); // Remove drafts older than 14 days
      sessionStorage.setItem(cleanupKey, "done");
    }
  }, []);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        setDraft(JSON.parse(savedDraft));
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, [draftKey]);

  // Save draft with better error handling
  const saveDraft = useCallback(
    (draftData: JournalDraft) => {
      try {
        const draftString = JSON.stringify(draftData);

        // Check if we have enough space
        try {
          localStorage.setItem(draftKey, draftString);
        } catch (e) {
          if (e instanceof Error && e.name === "QuotaExceededError") {
            console.warn(
              "[useJournalDraft] Storage quota exceeded, cleaning old drafts...",
            );
            // Emergency cleanup - remove oldest drafts
            purgeOldDrafts(7); // More aggressive cleanup

            // Try again
            try {
              localStorage.setItem(draftKey, draftString);
            } catch (e2) {
              console.error(
                "[useJournalDraft] Still cannot save draft after cleanup:",
                e2,
              );
              throw e2;
            }
          } else {
            throw e;
          }
        }

        setLastSaved(new Date());

        // Update drafts list
        const draftsList = JSON.parse(
          localStorage.getItem(DRAFT_LIST_KEY) || "[]",
        );
        const draftMeta = {
          key: draftKey,
          templateId: draftData.template,
          title: draftData.title || "Untitled",
          lastSaved: new Date().toISOString(),
          wordCount: draftData.metadata.totalWordCount,
        };

        const existingIndex = draftsList.findIndex(
          (d: { key: string }) => d.key === draftKey,
        );
        if (existingIndex >= 0) {
          draftsList[existingIndex] = draftMeta;
        } else {
          draftsList.push(draftMeta);
        }

        // Keep only recent drafts in the list (max 50)
        const sortedDrafts = draftsList
          .sort(
            (a: { lastSaved: string }, b: { lastSaved: string }) =>
              new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime(),
          )
          .slice(0, 50);

        localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(sortedDrafts));
      } catch (error) {
        console.error("Failed to save draft:", error);
        // Don't throw - we don't want to break the app if drafts can't be saved
      }
    },
    [draftKey],
  );

  // Delete draft
  const deleteDraft = useCallback(() => {
    localStorage.removeItem(draftKey);

    // Remove from drafts list
    try {
      const draftsList = JSON.parse(
        localStorage.getItem(DRAFT_LIST_KEY) || "[]",
      );
      const filtered = draftsList.filter(
        (d: { key: string }) => d.key !== draftKey,
      );
      localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Failed to update drafts list:", error);
    }

    setDraft(null);
  }, [draftKey]);

  // Get all drafts
  const getAllDrafts = useCallback(() => {
    try {
      const draftsList = JSON.parse(
        localStorage.getItem(DRAFT_LIST_KEY) || "[]",
      );
      return draftsList;
    } catch {
      return [];
    }
  }, []);

  // Clean old drafts (older than specified days)
  const cleanOldDrafts = useCallback((daysOld = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const draftsList = JSON.parse(
        localStorage.getItem(DRAFT_LIST_KEY) || "[]",
      );
      const filtered = draftsList.filter(
        (d: { lastSaved: string; key: string }) => {
          const lastSaved = new Date(d.lastSaved);
          if (lastSaved < cutoffDate) {
            localStorage.removeItem(d.key);
            return false;
          }
          return true;
        },
      );

      localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(filtered));
      console.log(
        `[useJournalDraft] Cleaned ${draftsList.length - filtered.length} old drafts`,
      );
    } catch (error) {
      console.error("Failed to clean old drafts:", error);
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !draft) return;

    const timeoutId = setTimeout(() => {
      saveDraft(draft);
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [draft, autoSave, autoSaveDelay, saveDraft]);

  return {
    draft,
    setDraft,
    saveDraft,
    deleteDraft,
    lastSaved,
    getAllDrafts,
    cleanOldDrafts,
  };
}

// useJournalDraft.ts
import { useState, useEffect, useCallback } from 'react';
import type { JournalDraft } from '../types/enhanced-template.types';

const DRAFT_KEY_PREFIX = 'journal-draft-';
const DRAFT_LIST_KEY = 'journal-drafts-list';

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
  autoSaveDelay = 5000
}: UseJournalDraftOptions) {
  const draftKey = `${DRAFT_KEY_PREFIX}${entryId || templateId}-${Date.now()}`;
  const [draft, setDraft] = useState<JournalDraft | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        setDraft(JSON.parse(savedDraft));
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [draftKey]);
  
  // Save draft
  const saveDraft = useCallback((draftData: JournalDraft) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setLastSaved(new Date());
      
      // Update drafts list
      const draftsList = JSON.parse(localStorage.getItem(DRAFT_LIST_KEY) || '[]');
      const draftMeta = {
        key: draftKey,
        templateId: draftData.template,
        title: draftData.title || 'Untitled',
        lastSaved: new Date().toISOString(),
        wordCount: draftData.metadata.totalWordCount
      };
      
      const existingIndex = draftsList.findIndex((d: {key: string}) => d.key === draftKey);
      if (existingIndex >= 0) {
        draftsList[existingIndex] = draftMeta;
      } else {
        draftsList.push(draftMeta);
      }
      
      localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(draftsList));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [draftKey]);
  
  // Delete draft
  const deleteDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
    
    // Remove from drafts list
    const draftsList = JSON.parse(localStorage.getItem(DRAFT_LIST_KEY) || '[]');
    const filtered = draftsList.filter((d: {key: string}) => d.key !== draftKey);
    localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(filtered));
    
    setDraft(null);
  }, [draftKey]);
  
  // Get all drafts
  const getAllDrafts = useCallback(() => {
    try {
      const draftsList = JSON.parse(localStorage.getItem(DRAFT_LIST_KEY) || '[]');
      return draftsList;
    } catch {
      return [];
    }
  }, []);
  
  // Clean old drafts (older than 30 days)
  const cleanOldDrafts = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const draftsList = JSON.parse(localStorage.getItem(DRAFT_LIST_KEY) || '[]');
    const filtered = draftsList.filter((d: {lastSaved: string; key: string}) => {
      const lastSaved = new Date(d.lastSaved);
      if (lastSaved < thirtyDaysAgo) {
        localStorage.removeItem(d.key);
        return false;
      }
      return true;
    });
    
    localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(filtered));
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
    cleanOldDrafts
  };
}
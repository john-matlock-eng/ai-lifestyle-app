// Example: Using the Enhanced Journal System
import React, { useState } from "react";
import {
  EnhancedJournalEditor,
  EnhancedTemplatePicker,
  DraftManager,
} from "./";
import { JournalTemplate } from "@/types/journal";
import type {
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
} from "@/types/journal";

/**
 * Example implementation showing how to use the enhanced journal system
 * This replaces the old JournalTemplateDemo
 */
export const JournalDemo: React.FC = () => {
  const [view, setView] = useState<"picker" | "editor" | "drafts">("picker");
  const [selectedTemplate, setSelectedTemplate] =
    useState<JournalTemplate | null>(null);

  const handleSave = async (
    request: CreateJournalEntryRequest | UpdateJournalEntryRequest,
  ) => {
    console.log("Saving journal entry:", {
      title: request.title,
      template: request.template,
      wordCount: request.wordCount,
      tags: request.tags,
      mood: request.mood,
      linkedGoals: request.linkedGoalIds,
    });

    // In a real app, you would:
    // 1. Call your API to save the entry
    // 2. Update IndexedDB for search
    // 3. Navigate to the saved entry

    alert("Journal entry saved! Check console for details.");

    // Reset for demo
    setView("picker");
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (templateId: JournalTemplate) => {
    setSelectedTemplate(templateId);
    setView("editor");
  };

  const handleDraftSelect = (draftKey: string) => {
    // Load draft and open editor
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      const parsed = JSON.parse(draft);
      setSelectedTemplate(parsed.template);
      setView("editor");
    }
  };

  // Render current view
  switch (view) {
    case "editor":
      return (
        <div className="min-h-screen bg-background p-8">
          <EnhancedJournalEditor
            templateId={selectedTemplate || JournalTemplate.BLANK}
            onSave={handleSave}
            onCancel={() => {
              setView("picker");
              setSelectedTemplate(null);
            }}
            autoSave={true}
            showEncryption={true}
          />
        </div>
      );

    case "drafts":
      return (
        <div className="min-h-screen bg-background p-8">
          <button
            onClick={() => setView("picker")}
            className="mb-4 text-muted hover:text-theme"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold mb-6">Your Drafts</h1>
          <DraftManager onSelectDraft={handleDraftSelect} />
        </div>
      );

    default:
      return (
        <div className="min-h-screen bg-background p-8">
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setView("drafts")}
              className="text-muted hover:text-theme"
            >
              View Drafts →
            </button>
          </div>
          <EnhancedTemplatePicker
            onSelect={handleTemplateSelect}
            showBlank={true}
          />
        </div>
      );
  }
};

export default JournalDemo;

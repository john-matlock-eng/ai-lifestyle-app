// Enhanced template types that work with existing JournalEntry structure
import type { JournalTemplate as JournalTemplateEnum, GoalProgress } from '@/types/journal';

export interface EnhancedTemplate {
  id: JournalTemplateEnum;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sections: SectionDefinition[];
  extractors?: {
    mood?: (responses: Record<string, SectionResponse>) => string | undefined;
    tags?: (responses: Record<string, SectionResponse>) => string[];
    goalProgress?: (responses: Record<string, SectionResponse>) => GoalProgress[];
  };
}

export interface SectionDefinition {
  id: string;
  title: string;
  prompt: string;
  type: 'text' | 'scale' | 'mood' | 'choice' | 'tags' | 'goals' | 'checklist' | 'emotions';
  required?: boolean;
  options?: {
    min?: number;
    max?: number;
    choices?: Array<{ value: string; label: string; icon?: string }>;
    moods?: Array<{ value: string; label: string; emoji: string }>;
    items?: Array<{ id: string; label: string }>;
    maxSelections?: number;
    mode?: 'wheel' | 'list' | 'both';
  };
}

export interface SectionResponse {
  sectionId: string;
  value: string | number | string[] | Record<string, boolean>;
  metadata?: {
    wordCount?: number;
    completedAt?: string;
  };
}

export interface JournalDraft {
  template: JournalTemplateEnum;
  title: string;
  sections: SectionResponse[];
  metadata: {
    startedAt: string;
    lastSavedAt: string;
    totalWordCount: number;
  };
}

// Note: Content utilities have been moved to enhanced-template-content-utils.ts
// for better organization and enhanced functionality with section markers
// EnhancedJournalEditor.tsx - Fixed version
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save,
  Check,
  Timer,
  Target,
  Hash,
  Calendar,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/common';
import { useGoals } from '@/features/goals/hooks/useGoals';
import type { Goal } from '@/features/goals/types/api.types';
// import { journalStorage } from '../../services/JournalStorageService';
import type { 
  JournalEntry,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  JournalTemplate as JournalTemplateEnum,
  GoalProgress
} from '@/types/journal';
import type { 
  SectionResponse,
  JournalDraft
} from '../../types/enhanced-template.types';
import { enhancedJournalContentUtils } from '../../templates/enhanced-template-content-utils';
import { enhancedTemplates } from '../../templates/enhanced-templates';
import SectionEditor from './SectionEditor';
import { getEncryptionService } from '@/services/encryption';
import { shouldTreatAsEncrypted } from '@/utils/encryption-utils';

export interface EnhancedJournalEditorProps {
  templateId?: JournalTemplateEnum;
  entry?: JournalEntry;
  onSave: (request: CreateJournalEntryRequest | UpdateJournalEntryRequest) => Promise<void>;
  onCancel?: () => void;
  autoSave?: boolean;
  showEncryption?: boolean;
}

const DRAFT_KEY_PREFIX = 'journal-draft-';

export const EnhancedJournalEditor: React.FC<EnhancedJournalEditorProps> = ({
  templateId = 'blank',
  entry,
  onSave,
  onCancel,
  autoSave = true,
  showEncryption = true,
}) => {
  // Get template configuration - use entry's template if editing
  const template = enhancedTemplates[entry?.template || templateId] || enhancedTemplates.blank;
  
  // State
  const [title, setTitle] = useState(entry?.title || '');
  const [sections, setSections] = useState<SectionResponse[]>([]);
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [isEncrypted, setIsEncrypted] = useState(entry?.isEncrypted || false);
  const [linkedGoalIds, setLinkedGoalIds] = useState<string[]>(entry?.linkedGoalIds || []);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  
  // Draft key for this specific entry/template
  const draftKey = `${DRAFT_KEY_PREFIX}${entry?.entryId || templateId}-${Date.now()}`;
  
  // Fetch available goals
  const { data: goalsData } = useGoals({ status: ['active'] });
  const availableGoals = goalsData?.goals || [];
  
  // Helper functions
  const getDefaultValue = useCallback((type: string): string | number | string[] | Record<string, boolean> => {
    switch (type) {
      case 'text': return '';
      case 'scale': return 5;
      case 'mood': return '';
      case 'choice': return '';
      case 'tags': return [];
      case 'goals': return [];
      case 'emotions': return [];
      case 'checklist': return {};
      default: return '';
    }
  }, []);
  
  const calculateTotalWordCount = useCallback((): number => {
    const titleWords = title.split(/\s+/).filter(w => w).length;
    const contentWords = sections.reduce((total, section) => {
      if (typeof section.value === 'string') {
        return total + section.value.split(/\s+/).filter(w => w).length;
      }
      return total;
    }, 0);
    return titleWords + contentWords;
  }, [title, sections]);

  // Initialize sections from template or existing entry
  useEffect(() => {
    const initializeSections = async () => {
      if (entry) {
        setIsLoadingEntry(true);
        try {
          let contentToParse = entry.content;
          
          // Handle encrypted entries
          if (shouldTreatAsEncrypted(entry) && entry.encryptedKey) {
            try {
              const encryptionService = getEncryptionService();
              const decrypted = await encryptionService.decryptContent({
                content: entry.content,
                encryptedKey: entry.encryptedKey,
                iv: entry.encryptionIv!,
              });
              contentToParse = decrypted;
            } catch (error) {
              console.error('Failed to decrypt content for editing:', error);
              // Initialize with empty sections if decryption fails
              const initialSections: SectionResponse[] = template.sections.map(section => ({
                sectionId: section.id,
                value: getDefaultValue(section.type),
                metadata: {}
              }));
              setSections(initialSections);
              setIsLoadingEntry(false);
              return;
            }
          }
          
          // Parse content back to sections
          const parsedSections = enhancedJournalContentUtils.contentToSections(template, contentToParse);
          
          // IMPORTANT: Trust the parser! The parser already handles defaults properly
          setSections(parsedSections);
        } finally {
          setIsLoadingEntry(false);
        }
      } else {
        // Initialize empty sections for new entry
        const initialSections: SectionResponse[] = template.sections.map(section => ({
          sectionId: section.id,
          value: getDefaultValue(section.type),
          metadata: {}
        }));
        setSections(initialSections);
      }
    };
    
    initializeSections();
  }, [entry, template, getDefaultValue]);
  
  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  
  // Auto-save to localStorage
  useEffect(() => {
    if (!autoSave || isLoadingEntry) return;
    
    const draft: JournalDraft = {
      template: entry?.template || templateId,
      title,
      sections,
      metadata: {
        startedAt: new Date(startTime).toISOString(),
        lastSavedAt: new Date().toISOString(),
        totalWordCount: calculateTotalWordCount()
      }
    };
    
    localStorage.setItem(draftKey, JSON.stringify(draft));
    
    return () => {
      // Clean up draft on unmount if saved successfully
      if (showSuccess) {
        localStorage.removeItem(draftKey);
      }
    };
  }, [title, sections, tags, autoSave, draftKey, showSuccess, templateId, entry?.template, startTime, calculateTotalWordCount, isLoadingEntry]);
  
  function extractMetadata() {
    const metadata: {
      mood?: string;
      tags: string[];
      goalProgress: GoalProgress[];
    } = {
      tags: [...tags],
      goalProgress: []
    };
    
    // Extract mood from sections
    if (template.extractors?.mood) {
      const sectionValues = sections.reduce((acc, section) => {
        acc[section.sectionId] = section;
        return acc;
      }, {} as Record<string, SectionResponse>);
      metadata.mood = template.extractors.mood(sectionValues);
    } else {
      // Default: look for mood section
      const moodSection = sections.find(s => {
        const sectionDef = template.sections.find(def => def.id === s.sectionId);
        return sectionDef?.type === 'mood';
      });
      if (moodSection?.value && typeof moodSection.value === 'string') {
        metadata.mood = moodSection.value;
      }
    }
    
    // Extract additional tags from sections
    const tagSections = sections.filter(s => {
      const sectionDef = template.sections.find(def => def.id === s.sectionId);
      return sectionDef?.type === 'tags';
    });
    tagSections.forEach(section => {
      if (Array.isArray(section.value)) {
        metadata.tags.push(...section.value);
      }
    });
    
    // Extract goal progress
    if (template.extractors?.goalProgress) {
      const sectionValues = sections.reduce((acc, section) => {
        acc[section.sectionId] = section;
        return acc;
      }, {} as Record<string, SectionResponse>);
      metadata.goalProgress = template.extractors.goalProgress(sectionValues) || [];
    } else {
      // Default goal progress
      linkedGoalIds.forEach(goalId => {
        metadata.goalProgress.push({
          goalId,
          completed: false,
          notes: `Journal entry on ${new Date().toLocaleDateString()}`
        });
      });
    }
    
    return metadata;
  }
  
  const handleSectionChange = useCallback((sectionId: string, value: string | number | string[] | Record<string, boolean>) => {
    setSections(prev => prev.map(section => 
      section.sectionId === sectionId 
        ? { ...section, value, metadata: { ...section.metadata, completedAt: new Date().toISOString() } }
        : section
    ));
  }, []);
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Generate content from sections
      const content = enhancedJournalContentUtils.sectionsToContent(template, sections);
      const wordCount = calculateTotalWordCount();
      const metadata = extractMetadata();
      
      let finalContent = content;
      let encryptionData = {};
      
      // Handle encryption if enabled
      if (isEncrypted && showEncryption) {
        try {
          const encryptionService = getEncryptionService();
          const encrypted = await encryptionService.encryptContent(finalContent);
          finalContent = encrypted.content;
          encryptionData = {
            encryptedKey: encrypted.encryptedKey,
            encryptionIv: encrypted.iv
          };
        } catch (error) {
          console.error('Encryption failed:', error);
          throw new Error('Failed to encrypt journal entry');
        }
      }
      
      const request: CreateJournalEntryRequest | UpdateJournalEntryRequest = {
        title,
        content: finalContent,
        template: entry?.template || templateId,
        wordCount,
        tags: metadata.tags,
        mood: metadata.mood,
        linkedGoalIds,
        goalProgress: metadata.goalProgress,
        isEncrypted,
        ...encryptionData
      };
      
      await onSave(request);
      
      // Clean up draft
      localStorage.removeItem(draftKey);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const completedSections = sections.filter(s => {
    const sectionDef = template.sections.find(def => def.id === s.sectionId);
    if (!sectionDef) return false;
    
    switch (sectionDef.type) {
      case 'text':
        return s.value && typeof s.value === 'string' && s.value.trim().length > 0;
      case 'scale':
      case 'mood':
      case 'choice':
        return s.value !== null && s.value !== undefined && s.value !== '';
      case 'tags':
      case 'goals':
        return Array.isArray(s.value) && s.value.length > 0;
      case 'checklist':
        return Object.values(s.value as Record<string, boolean>).some(v => v);
      default:
        return false;
    }
  }).length;
  
  const progress = Math.round((completedSections / template.sections.length) * 100);
  
  if (isLoadingEntry) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted mt-4">Loading journal entry...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="enhanced-journal-editor max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Journal Entry Title..."
              className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-muted text-theme"
            />
            <div className="flex items-center gap-4 mt-2 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {entry ? new Date(entry.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Timer className="w-4 h-4" />
                {formatTime(elapsedTime)}
              </span>
              <span>{calculateTotalWordCount()} words</span>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="text-center">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-surface-muted"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                  className="text-accent transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </div>
            <p className="text-xs text-muted mt-1">
              {completedSections}/{template.sections.length}
            </p>
          </div>
        </div>
        
        {/* Tags and Goals */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-surface-muted">
          {/* Tags */}
          <div className="flex items-center gap-2 flex-1">
            <Hash className="w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Add tags..."
              className="text-sm bg-transparent outline-none flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  setTags([...tags, e.currentTarget.value]);
                  e.currentTarget.value = '';
                }
              }}
            />
            {tags.map((tag, i) => (
              <span key={i} className="tag tag-sm">
                {tag}
                <button
                  onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                  className="ml-1 text-xs hover:text-error"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          {/* Linked Goals */}
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted" />
            <select
              className="text-sm bg-transparent outline-none border border-surface-muted rounded px-2 py-1"
              onChange={(e) => {
                if (e.target.value && !linkedGoalIds.includes(e.target.value)) {
                  setLinkedGoalIds([...linkedGoalIds, e.target.value]);
                  e.target.value = '';
                }
              }}
            >
              <option value="">Link a goal...</option>
              {availableGoals
                .filter((g: Goal) => !linkedGoalIds.includes(g.goalId))
                .map((goal: Goal) => (
                  <option key={goal.goalId} value={goal.goalId}>{goal.title}</option>
                ))}
            </select>
            {linkedGoalIds.map(goalId => {
              const goal = availableGoals.find((g: Goal) => g.goalId === goalId);
              return goal ? (
                <span key={goalId} className="tag tag-sm bg-accent/10 text-accent">
                  {goal.title}
                  <button
                    onClick={() => setLinkedGoalIds(linkedGoalIds.filter(id => id !== goalId))}
                    className="ml-1 text-xs hover:text-error"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
          
          {/* Encryption toggle */}
          {showEncryption && (
            <label className="ml-auto flex items-center gap-2 cursor-pointer">
              {isEncrypted ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <input
                type="checkbox"
                checked={isEncrypted}
                onChange={(e) => setIsEncrypted(e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm">
                {isEncrypted ? 'Encrypted' : 'Not encrypted'}
              </span>
            </label>
          )}
        </div>
      </div>
      
      {/* Template Sections */}
      <div className="space-y-4 mb-6">
        {template.sections.map((section, index) => {
          const sectionData = sections.find(s => s.sectionId === section.id);
          return (
            <SectionEditor
              key={section.id}
              section={section}
              value={sectionData?.value || getDefaultValue(section.type)}
              onChange={(value) => handleSectionChange(section.id, value)}
              isCompleted={completedSections > index}
              availableGoals={availableGoals}
            />
          );
        })}
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center justify-between sticky bottom-4 glass rounded-xl p-4">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        
        <Button
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className={`ml-auto ${showSuccess ? 'bg-success' : ''}`}
        >
          {isSaving ? (
            <>Saving...</>
          ) : showSuccess ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {entry ? 'Update' : 'Save'} Entry
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EnhancedJournalEditor;
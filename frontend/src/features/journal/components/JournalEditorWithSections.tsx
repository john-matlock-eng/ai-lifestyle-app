import React, { useState, useRef } from 'react';
import { 
  Save, 
  FileText, 
  Heart, 
  Target, 
  Smile, 
  Star, 
  Zap,
  Sparkles,
  RotateCcw,
  Check
} from 'lucide-react';

import EditorSection from './EditorSection';
import type { JournalTemplate } from '../types/template.types';
import '../styles/journal-editor.css';

export interface JournalEditorWithSectionsProps {
  template: JournalTemplate;
  initialData?: Record<string, string>;
  onSave: (data: {
    templateId: string;
    sections: { id: string; title: string; markdown: string }[];
    markdownExport: string;
  }) => void | Promise<void>;
  draftId?: string;
  readOnly?: boolean;
  className?: string;
}

const JournalEditorWithSections: React.FC<JournalEditorWithSectionsProps> = ({
  template,
  initialData = {},
  onSave,
  draftId,
  readOnly = false,
  className = '',
}) => {
  const [content, setContent] = useState<Record<string, string>>(
    Object.fromEntries(template.sections.map((s) => [s.id, initialData[s.id] || '']))
  );
  const draftBase = useRef(draftId ?? `${template.id}-${Date.now()}`);
  const [saveCounter, setSaveCounter] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (id: string) => (markdown: string) => {
    setContent((prev) => ({ ...prev, [id]: markdown }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const sections = template.sections.map((s) => ({
      id: s.id,
      title: s.title,
      markdown: content[s.id] ?? '',
    }));
    const markdownExport = sections
      .map((s) => `## ${s.title}\n\n${s.markdown}`)
      .join('\n\n');

    try {
      await Promise.resolve(onSave({
        templateId: template.id,
        sections,
        markdownExport,
      }));

      // Clear all drafts
      template.sections.forEach((s) => {
        const key = `journal-draft-${draftBase.current}-${s.id}`;
        localStorage.removeItem(key);
      });
      setSaveCounter((c) => c + 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all sections? This will clear all your content.')) {
      setContent(Object.fromEntries(template.sections.map((s) => [s.id, ''])));
      template.sections.forEach((s) => {
        const key = `journal-draft-${draftBase.current}-${s.id}`;
        localStorage.removeItem(key);
      });
    }
  };

  // Get icons for sections based on their ID or title
  const getSectionIcon = (section: typeof template.sections[0]) => {
    const id = section.id.toLowerCase();
    const title = section.title.toLowerCase();
    
    if (id.includes('gratitude') || title.includes('gratitude')) {
      return <Heart className="w-5 h-5" />;
    }
    if (id.includes('goal') || title.includes('goal')) {
      return <Target className="w-5 h-5" />;
    }
    if (id.includes('mood') || title.includes('mood')) {
      return <Smile className="w-5 h-5" />;
    }
    if (id.includes('reflection') || title.includes('reflection')) {
      return <Star className="w-5 h-5" />;
    }
    if (id.includes('energy') || title.includes('energy') || id.includes('habit')) {
      return <Zap className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  // Calculate total word count
  const totalWords = Object.values(content)
    .join(' ')
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  return (
    <div className={`relative ${className}`}>
      {/* Header Stats */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-surface via-surface-hover to-surface shadow-md border border-surface-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-theme">{template.name}</h2>
            </div>
            {template.description && (
              <p className="text-sm text-muted ml-9">{template.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient">{totalWords}</div>
              <div className="text-xs text-muted">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-theme">{template.sections.length}</div>
              <div className="text-xs text-muted">Sections</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {template.sections.map((section) => (
          <EditorSection
            key={section.id}
            section={section}
            initialContent={content[section.id]}
            readOnly={readOnly}
            onChange={handleChange(section.id)}
            draftId={`${draftBase.current}-${section.id}`}
            saveSignal={saveCounter}
            icon={getSectionIcon(section)}
          />
        ))}
      </div>

      {/* Action Bar */}
      {!readOnly && (
        <div className="mt-8 sticky bottom-0 glass p-4 rounded-2xl shadow-xl border border-surface-muted/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Auto-save enabled</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-muted hover:text-theme hover:bg-surface-muted transition-all hover-lift"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  px-6 py-2 rounded-lg font-medium
                  bg-gradient text-white shadow-lg
                  transform transition-all duration-200
                  hover:scale-105 hover:shadow-xl hover:shadow-accent/20
                  active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${showSuccess ? 'save-success ring-4 ring-success/50' : ''}
                `}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : showSuccess ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Saved!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Entry
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEditorWithSections;
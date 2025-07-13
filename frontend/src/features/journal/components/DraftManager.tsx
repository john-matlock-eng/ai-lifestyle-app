// DraftManager.tsx
import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Clock, 
  Trash2, 
  Edit,
  Calendar,
  Hash
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { JournalTemplate } from '@/types/journal';
import { getTemplateName, getTemplateIcon } from '../templates/template-utils';

interface DraftMeta {
  key: string;
  templateId: JournalTemplate;
  title: string;
  lastSaved: string;
  wordCount: number;
}

interface DraftManagerProps {
  onSelectDraft: (draftKey: string) => void;
  onDeleteDraft?: (draftKey: string) => void;
  className?: string;
}

const DRAFT_LIST_KEY = 'journal-drafts-list';

export const DraftManager: React.FC<DraftManagerProps> = ({
  onSelectDraft,
  onDeleteDraft,
  className = ''
}) => {
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    try {
      const draftsList = JSON.parse(localStorage.getItem(DRAFT_LIST_KEY) || '[]');
      // Sort by most recent first
      draftsList.sort((a: DraftMeta, b: DraftMeta) => 
        new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime()
      );
      setDrafts(draftsList);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      setDrafts([]);
    }
  };

  const handleDeleteDraft = (draftKey: string) => {
    if (!window.confirm('Delete this draft? This cannot be undone.')) return;

    // Remove from localStorage
    localStorage.removeItem(draftKey);
    
    // Update drafts list
    const updatedDrafts = drafts.filter(d => d.key !== draftKey);
    localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    
    if (onDeleteDraft) {
      onDeleteDraft(draftKey);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedDrafts.size === 0) return;
    
    if (!window.confirm(`Delete ${selectedDrafts.size} drafts? This cannot be undone.`)) return;

    selectedDrafts.forEach(key => {
      localStorage.removeItem(key);
    });

    const updatedDrafts = drafts.filter(d => !selectedDrafts.has(d.key));
    localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setSelectedDrafts(new Set());
  };

  const toggleSelectDraft = (draftKey: string) => {
    const newSelected = new Set(selectedDrafts);
    if (newSelected.has(draftKey)) {
      newSelected.delete(draftKey);
    } else {
      newSelected.add(draftKey);
    }
    setSelectedDrafts(newSelected);
  };

  if (drafts.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
        <p className="text-muted">No drafts saved</p>
      </div>
    );
  }

  return (
    <div className={`draft-manager ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-theme">Saved Drafts ({drafts.length})</h3>
        {selectedDrafts.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="text-sm text-error hover:text-error/80 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Delete {selectedDrafts.size} selected
          </button>
        )}
      </div>

      {/* Drafts List */}
      <div className="space-y-2">
        {drafts.map(draft => (
          <div
            key={draft.key}
            className={`
              draft-item group relative
              p-4 rounded-lg border transition-all
              ${selectedDrafts.has(draft.key) 
                ? 'border-accent bg-accent/5' 
                : 'border-surface-muted bg-surface hover:bg-surface-hover'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedDrafts.has(draft.key)}
                onChange={() => toggleSelectDraft(draft.key)}
                className="mt-1 w-4 h-4 rounded border-surface-muted text-accent focus:ring-accent"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Draft Content */}
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onSelectDraft(draft.key)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-theme flex items-center gap-2">
                      <span className="text-lg">{getTemplateIcon(draft.templateId)}</span>
                      {draft.title || 'Untitled Draft'}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {getTemplateName(draft.templateId)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(draft.lastSaved), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {draft.wordCount} words
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(draft.lastSaved).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDraft(draft.key);
                      }}
                      className="p-2 rounded-lg hover:bg-surface-muted transition-colors"
                      title="Continue writing"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDraft(draft.key);
                      }}
                      className="p-2 rounded-lg hover:bg-error/10 text-error transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DraftManager;
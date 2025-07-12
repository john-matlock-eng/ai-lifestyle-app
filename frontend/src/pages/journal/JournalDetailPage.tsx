import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Edit2, Trash2, Save, X, Calendar, FileText, Tag, Smile, Flag } from 'lucide-react';
import { Button } from '../../components/common';
import { JournalEditor } from '../../features/journal/components';
import { JournalEditorWithSections } from '../../features/journal/components';
import { useTemplateRegistry } from '../../features/journal/hooks/useTemplateRegistry';
import { getEntry, updateEntry, deleteEntry } from '../../api/journal';
import type { UpdateJournalEntryRequest, JournalEntry } from '../../types/journal';

// Map journal template types to actual template IDs
const TEMPLATE_MAPPING: Record<string, string> = {
  daily_reflection: 'daily_log',
  gratitude: 'gratitude_daily',
  goal_progress: 'daily_log',
  mood_tracker: 'daily_log',
  habit_tracker: 'daily_log',
  creative_writing: 'daily_log',
  blank: 'daily_log',
};

const JournalDetailPage: React.FC = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { templates } = useTemplateRegistry();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [editedMood, setEditedMood] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Fetch journal entry
  const { data: entry, isLoading, error } = useQuery({
    queryKey: ['journal', 'entry', entryId],
    queryFn: () => getEntry(entryId!),
    enabled: !!entryId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateJournalEntryRequest) => updateEntry(entryId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'entry', entryId] });
      setIsEditMode(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteEntry(entryId!),
    onSuccess: () => {
      navigate('/journal');
    },
  });

  // Initialize edit form when entry loads or edit mode changes
  React.useEffect(() => {
    if (entry && isEditMode) {
      setEditedTitle(entry.title);
      setEditedTags(entry.tags);
      setEditedMood(entry.mood || '');
    }
  }, [entry, isEditMode]);

  const handleSave = async (content: string) => {
    await updateMutation.mutateAsync({
      title: editedTitle,
      content,
      tags: editedTags,
      mood: editedMood || undefined,
    });
  };

  const handleSaveWithSections = async (editorData: {
    templateId: string;
    sections: { id: string; title: string; markdown: string }[];
    markdownExport: string;
  }) => {
    await handleSave(editorData.markdownExport);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync();
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset form to original values
    if (entry) {
      setEditedTitle(entry.title);
      setEditedTags(entry.tags);
      setEditedMood(entry.mood || '');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!editedTags.includes(tagInput.trim())) {
        setEditedTags([...editedTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">Failed to load journal entry. Please try again.</p>
          </div>
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/journal')}
          >
            Back to Journal
          </Button>
        </div>
      </div>
    );
  }

  // Get the template for this entry
  const actualTemplateId = TEMPLATE_MAPPING[entry.template] || 'daily_log';
  const currentTemplate = templates.find(t => t.id === actualTemplateId);
  const hasTemplate = !!currentTemplate && entry.template !== 'blank';

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/journal')}
              className="text-muted hover:text-theme"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            {isEditMode ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-primary-500 outline-none"
              />
            ) : (
              <h1 className="text-2xl font-bold text-theme">{entry.title}</h1>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isEditMode ? (
              <>
                <Button
                  variant="outline"
                  leftIcon={<Edit2 className="h-4 w-4" />}
                  onClick={() => setIsEditMode(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  leftIcon={<Save className="h-4 w-4" />}
                  disabled={updateMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<X className="h-4 w-4" />}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-surface rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Calendar className="h-4 w-4" />
              <span>Created: {format(new Date(entry.createdAt), 'PPpp')}</span>
              {entry.updatedAt !== entry.createdAt && (
                <span>• Updated: {format(new Date(entry.updatedAt), 'PPpp')}</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted">
              <FileText className="h-4 w-4" />
              <span>{entry.wordCount} words</span>
            </div>

            {(entry.mood || isEditMode) && (
              <div className="flex items-center gap-2">
                <Smile className="h-4 w-4 text-muted" />
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedMood}
                    onChange={(e) => setEditedMood(e.target.value)}
                    placeholder="How are you feeling?"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  />
                ) : (
                  <span className="text-sm text-muted">Mood: {entry.mood}</span>
                )}
              </div>
            )}

            {(entry.tags.length > 0 || isEditMode) && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-muted mt-1" />
                {isEditMode ? (
                  <div className="flex-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Press Enter to add tags..."
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editedTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Linked Goals */}
        {entry.linkedGoalIds.length > 0 && (
          <div className="bg-surface rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Flag className="h-4 w-4 text-muted" />
              <h2 className="text-lg font-semibold">Linked Goals</h2>
            </div>
            <div className="space-y-2">
              {entry.linkedGoalIds.map((goalId) => (
                <Link
                  key={goalId}
                  to={`/goals/${goalId}`}
                  className="block text-primary-600 hover:text-primary-700"
                >
                  View Goal →
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Journal Content */}
        <div className="bg-surface rounded-lg p-6">
          {hasTemplate && currentTemplate ? (
            <JournalEditorWithSections
              template={currentTemplate}
              initialData={entry.content ? { content: entry.content } : undefined}
              onSave={handleSaveWithSections}
              readOnly={!isEditMode}
              draftId={`journal-${entryId}`}
            />
          ) : (
            <JournalEditor
              initialContent={entry.content}
              onSave={handleSave}
              readOnly={!isEditMode}
              draftId={`journal-${entryId}`}
            />
          )}
        </div>

        {/* Error messages */}
        {updateMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <p className="text-red-700">Failed to update journal entry. Please try again.</p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-2">Delete Journal Entry?</h3>
              <p className="text-muted mb-6">
                Are you sure you want to delete this journal entry? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalDetailPage;
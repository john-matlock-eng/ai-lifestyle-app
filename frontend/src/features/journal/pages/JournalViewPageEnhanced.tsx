// JournalViewPageEnhanced.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share2, 
  Lock,
  Unlock,
  Calendar,
  Clock,
  FileText,
  Hash,
  Target,
  Heart,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/common';
import { getEntry, deleteEntry } from '@/api/journal';
import { journalStorage } from '../services/JournalStorageService';
import { getTemplateIcon, getTemplateName } from '../templates/template-utils';
import type { JournalEntry } from '@/types/journal';

export const JournalViewPageEnhanced: React.FC = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch entry
  const { data: entry, isLoading, error } = useQuery({
    queryKey: ['journal', 'entry', entryId],
    queryFn: () => getEntry(entryId!),
    enabled: !!entryId
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteEntry(entryId!),
    onSuccess: async () => {
      // Remove from IndexedDB
      await journalStorage.deleteEntry(entryId!);
      navigate('/journal');
    }
  });

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  if (isLoading) {
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
            <Button onClick={() => navigate('/journal')}>
              Back to Journals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getMoodEmoji = (mood?: string) => {
    const moodMap: Record<string, string> = {
      amazing: '🤩',
      good: '😊',
      okay: '😐',
      stressed: '😰',
      sad: '😢',
      joyful: '😊',
      content: '😌',
      anxious: '😰',
      angry: '😠',
      tired: '😴',
      inspired: '✨',
      relaxed: '😌',
      energized: '⚡',
      thoughtful: '🤔',
      emotional: '💭',
      grateful: '🙏'
    };
    return moodMap[mood || ''] || '😐';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/journal')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Journals
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/journal/${entryId}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className={showDeleteConfirm ? 'text-error' : ''}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {showDeleteConfirm ? 'Confirm Delete?' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Entry Header */}
        <div className="glass rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-theme mb-4">{entry.title}</h1>
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(entry.createdAt), 'MMMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {format(new Date(entry.createdAt), 'h:mm a')}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {entry.wordCount} words
                </span>
                <span className="flex items-center gap-1">
                  {entry.isEncrypted ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {entry.isEncrypted ? 'Encrypted' : 'Not encrypted'}
                </span>
              </div>
              
              {/* Template & Mood */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-surface-muted rounded-full">
                  <span className="text-lg">{getTemplateIcon(entry.template)}</span>
                  <span className="text-sm font-medium">{getTemplateName(entry.template)}</span>
                </div>
                
                {entry.mood && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-surface-muted rounded-full">
                    <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                    <span className="text-sm font-medium capitalize">{entry.mood}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Stats Card */}
            {(entry.linkedGoalIds.length > 0 || entry.goalProgress.length > 0) && (
              <div className="glass rounded-xl p-4 text-center">
                <Target className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-2xl font-bold text-theme">{entry.linkedGoalIds.length}</p>
                <p className="text-xs text-muted">Linked Goals</p>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {entry.tags.map(tag => (
              <span key={tag} className="tag">
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="glass rounded-2xl p-8 mb-6">
          {entry.isEncrypted ? (
            <div className="text-center py-12">
              <Lock className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted">This entry is encrypted</p>
              <p className="text-sm text-muted mt-2">
                Decrypt it in the editor to view the content
              </p>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Goal Progress */}
        {entry.goalProgress.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Goal Progress
            </h2>
            <div className="space-y-3">
              {entry.goalProgress.map((progress, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    progress.completed ? 'bg-success text-white' : 'bg-surface-muted'
                  }`}>
                    {progress.completed && '✓'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Goal #{index + 1}</p>
                    {progress.notes && (
                      <p className="text-sm text-muted mt-1">{progress.notes}</p>
                    )}
                  </div>
                  {progress.progressValue && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent">{progress.progressValue}</p>
                      <p className="text-xs text-muted">Progress</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => {
              // Share functionality
              if (navigator.share) {
                navigator.share({
                  title: entry.title,
                  text: `Check out my journal entry: ${entry.title}`,
                  url: window.location.href
                });
              }
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Button
            onClick={() => navigate(`/journal/${entryId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Entry
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JournalViewPageEnhanced;
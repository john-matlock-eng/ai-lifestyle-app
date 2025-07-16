// JournalViewPageEnhanced.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  TrendingUp,
  Users,
  X,
  BookOpen,
  Maximize2,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/common';
import { deleteEntry } from '@/api/journal';
import { journalStorage } from '../services/JournalStorageService';
import { getTemplateIcon, getTemplateName } from '../templates/template-utils';
import ShareDialog from '@/components/encryption/ShareDialog';
import ShareManagement from '@/components/encryption/ShareManagement';
import AIShareDialog from '@/components/encryption/AIShareDialog';
import { JournalActions } from '../components/JournalActions';
import { JournalEntryRenderer } from '../components/JournalEntryRenderer';
import { JournalReaderView } from '../components/JournalReaderView';
import { useEncryption } from '@/contexts/useEncryption';
import { getJournalService } from '../services/journal-service';
import { getEmotionById, getEmotionEmoji } from '../components/EmotionSelector/emotionData';
import { useJournalEntry, useJournalEntries } from '../hooks';
import { useAuth } from '@/contexts/useAuth';
import '../styles/journal-reader.css';

export const JournalViewPageEnhanced: React.FC = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isEncryptionSetup } = useEncryption();
  const { user } = useAuth();
  const journalService = getJournalService();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShareManagement, setShowShareManagement] = useState(false);
  const [showAIShareDialog, setShowAIShareDialog] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);
  const [showReaderMode, setShowReaderMode] = useState(false);

  // Fetch current entry (with decryption)
  const { data: entry, isLoading, error } = useJournalEntry(entryId);

  // Fetch all entries for navigation (only in reader mode)
  const { data: entriesData } = useJournalEntries({
    limit: 1000,
    filter: 'all' // Include shared entries in navigation
  });

  // Check access permissions
  const canEdit = React.useMemo(() => {
    if (!entry || !user) return false;
    return journalService.canEditEntry(entry, user.id);
  }, [entry, user, journalService]);

  const canShare = React.useMemo(() => {
    if (!entry || !user) return false;
    return journalService.canShareEntry(entry, user.id);
  }, [entry, user, journalService]);

  const isSharedAccess = React.useMemo(() => {
    return !!entry?.shareAccess;
  }, [entry]);

  // Calculate navigation state
  const navigationInfo = React.useMemo(() => {
    if (!entriesData?.entries || !entryId) {
      return { hasPrevious: false, hasNext: false, previousId: null, nextId: null };
    }
    
    // Extract entries from the response (could be JournalEntry or SharedJournalItem)
    const entries = entriesData.entries.map(item => 
      'entry' in item ? item.entry : item
    );
    
    const currentIndex = entries.findIndex(e => e.entryId === entryId);
    
    return {
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < entries.length - 1,
      previousId: currentIndex > 0 ? entries[currentIndex - 1].entryId : null,
      nextId: currentIndex < entries.length - 1 ? entries[currentIndex + 1].entryId : null
    };
  }, [entriesData, entryId]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteEntry(entryId!),
    onSuccess: async () => {
      // Remove from IndexedDB
      await journalStorage.deleteEntry(entryId!);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      navigate('/journal');
    }
  });

  const handleDelete = () => {
    if (!canEdit) return;
    
    if (showDeleteConfirm) {
      deleteMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const handleShare = (tokens: Array<{ id: string; recipientEmail: string; permissions: string[]; expiresAt: string }>) => {
    console.log('Created shares:', tokens);
    setShareSuccessMessage(`Successfully shared with ${tokens.length} recipient${tokens.length > 1 ? 's' : ''}`);
    setTimeout(() => setShareSuccessMessage(null), 3000);
    queryClient.invalidateQueries({ queryKey: ['journal-entry', entryId] });
  };

  const handleAIAnalysis = (analysisId: string) => {
    console.log('AI analysis started:', analysisId);
    setShareSuccessMessage('AI analysis has been initiated. Results will be available soon.');
    setTimeout(() => setShareSuccessMessage(null), 5000);
  };

  const handleShareRevoked = (shareId: string) => {
    console.log('Revoked share:', shareId);
    setShareSuccessMessage('Share access has been revoked.');
    setTimeout(() => setShareSuccessMessage(null), 3000);
    queryClient.invalidateQueries({ queryKey: ['journal-entry', entryId] });
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const targetId = direction === 'prev' ? navigationInfo.previousId : navigationInfo.nextId;
    if (targetId) {
      navigate(`/journal/${targetId}`);
    }
  };

  const getMoodDisplay = (mood?: string) => {
    if (!mood) return null;
    
    const emotion = getEmotionById(mood);
    if (emotion) {
      return {
        emoji: getEmotionEmoji(mood),
        label: emotion.label
      };
    }
    
    // Fallback for old mood values
    const legacyMoodMap: Record<string, { emoji: string; label: string }> = {
      amazing: { emoji: '🤩', label: 'Amazing' },
      good: { emoji: '😊', label: 'Good' },
      okay: { emoji: '😐', label: 'Okay' },
      stressed: { emoji: '😰', label: 'Stressed' },
      sad: { emoji: '😢', label: 'Sad' },
      joyful: { emoji: '😊', label: 'Joyful' },
      content: { emoji: '😌', label: 'Content' },
      anxious: { emoji: '😰', label: 'Anxious' },
      angry: { emoji: '😠', label: 'Angry' },
      tired: { emoji: '😴', label: 'Tired' },
      inspired: { emoji: '✨', label: 'Inspired' },
      relaxed: { emoji: '😌', label: 'Relaxed' },
      energized: { emoji: '⚡', label: 'Energized' },
      thoughtful: { emoji: '🤔', label: 'Thoughtful' },
      emotional: { emoji: '💭', label: 'Emotional' },
      grateful: { emoji: '🙏', label: 'Grateful' }
    };
    
    return legacyMoodMap[mood] || { emoji: '💭', label: mood };
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
            <p className="text-sm text-muted mb-4">
              The entry may not exist or your share access may have expired.
            </p>
            <Button onClick={() => navigate('/journal')}>
              Back to Journals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show reader mode if enabled
  if (showReaderMode && entry) {
    return (
      <JournalReaderView
        entry={entry}
        onEdit={canEdit ? () => navigate(`/journal/${entryId}/edit`) : undefined}
        onClose={() => setShowReaderMode(false)}
        onNavigate={handleNavigate}
        hasPrevious={navigationInfo.hasPrevious}
        hasNext={navigationInfo.hasNext}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Success Message */}
        {shareSuccessMessage && (
          <div className="mb-4 p-3 bg-success/10 text-success rounded-lg">
            {shareSuccessMessage}
          </div>
        )}

        {/* Shared Access Notification */}
        {isSharedAccess && entry.shareAccess && (
          <div className="mb-4 p-4 bg-info/10 rounded-lg border border-info/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-theme">
                  This journal was shared with you
                </p>
                <p className="text-xs text-muted mt-1">
                  {entry.shareAccess.expiresAt 
                    ? `Access expires: ${format(new Date(entry.shareAccess.expiresAt), 'MMM d, yyyy at h:mm a')}`
                    : 'No expiration date'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

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
              onClick={() => setShowReaderMode(true)}
              title="Reader Mode"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Read
            </Button>
            {isEncryptionSetup && entry.isEncrypted && canShare && (
              <JournalActions
                entry={entry}
                onShare={() => setShowShareDialog(true)}
                onAIAnalyze={() => setShowAIShareDialog(true)}
                onManageShares={() => setShowShareManagement(true)}
              />
            )}
            {canEdit && (
              <>
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
              </>
            )}
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
                {entry.sharedWith && entry.sharedWith.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Shared with {entry.sharedWith.length}
                  </span>
                )}
              </div>
              
              {/* Template & Mood */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-surface-muted rounded-full">
                  <span className="text-lg">{getTemplateIcon(entry.template)}</span>
                  <span className="text-sm font-medium">{getTemplateName(entry.template)}</span>
                </div>
                
                {(() => {
                  const moodDisplay = getMoodDisplay(entry.mood);
                  return moodDisplay ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-muted rounded-full">
                      <span className="text-lg">{moodDisplay.emoji}</span>
                      <span className="text-sm font-medium">{moodDisplay.label}</span>
                    </div>
                  ) : null;
                })()}
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
          <JournalEntryRenderer entry={entry} />
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
            onClick={() => setShowReaderMode(true)}
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Reader Mode
          </Button>
          
          {canShare && isEncryptionSetup && entry.isEncrypted ? (
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Encrypted
            </Button>
          ) : !isSharedAccess && (
            <Button
              variant="outline"
              onClick={() => {
                // Basic browser share API
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
          )}
          
          {canShare && entry.sharedWith && entry.sharedWith.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setShowShareManagement(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Shares
            </Button>
          )}
          
          {canEdit && (
            <Button
              onClick={() => navigate(`/journal/${entryId}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Entry
            </Button>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      {canShare && (
        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          items={[{
            id: entry.entryId,
            title: entry.title,
            type: 'journal',
            createdAt: entry.createdAt,
            encrypted: entry.isEncrypted
          }]}
          onShare={handleShare}
        />
      )}

      {/* AI Share Dialog */}
      {canShare && (
        <AIShareDialog
          isOpen={showAIShareDialog}
          onClose={() => setShowAIShareDialog(false)}
          items={[{
            id: entry.entryId,
            title: entry.title,
            type: 'journal',
            createdAt: entry.createdAt,
            encrypted: entry.isEncrypted
          }]}
          onAnalysisComplete={handleAIAnalysis}
        />
      )}

      {/* Share Management Modal */}
      {showShareManagement && canShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Manage Shares</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowShareManagement(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <ShareManagement 
              itemType="journal"
              onShareRevoked={handleShareRevoked}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalViewPageEnhanced;
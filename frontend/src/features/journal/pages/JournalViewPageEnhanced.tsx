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
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/common';
import { getEntry, deleteEntry } from '@/api/journal';
import { journalStorage } from '../services/JournalStorageService';
import { getTemplateIcon, getTemplateName } from '../templates/template-utils';
import ShareDialog from '@/components/encryption/ShareDialog';
import ShareManagement from '@/components/encryption/ShareManagement';
import AIShareDialog from '@/components/encryption/AIShareDialog';
import { JournalActions } from '../components/JournalActions';
import { JournalEntryRenderer } from '../components/JournalEntryRenderer';
import { useEncryption } from '@/contexts/useEncryption';
import { shouldTreatAsEncrypted } from '@/utils/encryption-utils';
import { getEncryptionService } from '@/services/encryption';
import { getEmotionById, getEmotionEmoji } from '../components/EmotionSelector/emotionData';

export const JournalViewPageEnhanced: React.FC = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const { isEncryptionSetup } = useEncryption();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShareManagement, setShowShareManagement] = useState(false);
  const [showAIShareDialog, setShowAIShareDialog] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);
  const [decryptedEntry, setDecryptedEntry] = useState<typeof entry | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Fetch entry
  const { data: entry, isLoading, error, refetch } = useQuery({
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

  const handleShare = (tokens: Array<{ id: string; recipientEmail: string; permissions: string[]; expiresAt: string }>) => {
    console.log('Created shares:', tokens);
    setShareSuccessMessage(`Successfully shared with ${tokens.length} recipient${tokens.length > 1 ? 's' : ''}`);
    setTimeout(() => setShareSuccessMessage(null), 3000);
    refetch(); // Refresh entry to show updated sharing status
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
    refetch(); // Refresh entry data
  };

  const decryptContent = React.useCallback(async () => {
    if (!entry) return;
    
    try {
      setIsDecrypting(true);
      const encryptionService = getEncryptionService();
      const decrypted = await encryptionService.decryptContent({
        content: entry.content,
        encryptedKey: entry.encryptedKey!,
        iv: entry.encryptionIv!,
      });
      
      // Create a decrypted version of the entry
      setDecryptedEntry({
        ...entry,
        content: decrypted
      });
    } catch (error) {
      console.error('Failed to decrypt content:', error);
      setDecryptedEntry(null);
    } finally {
      setIsDecrypting(false);
    }
  }, [entry]);

  // Handle decryption when entry loads
  React.useEffect(() => {
    if (!entry) return;

    const isActuallyEncrypted = shouldTreatAsEncrypted(entry);
    
    if (isActuallyEncrypted && entry.encryptedKey) {
      decryptContent();
    } else {
      setDecryptedEntry(entry);
    }
  }, [entry, decryptContent]);

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
            <Button onClick={() => navigate('/journal')}>
              Back to Journals
            </Button>
          </div>
        </div>
      </div>
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
            {isEncryptionSetup && entry.isEncrypted && (
              <JournalActions
                entry={entry}
                onShare={() => setShowShareDialog(true)}
                onAIAnalyze={() => setShowAIShareDialog(true)}
                onManageShares={() => setShowShareManagement(true)}
              />
            )}
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
          {isDecrypting ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-muted">Decrypting content...</p>
            </div>
          ) : decryptedEntry ? (
            <JournalEntryRenderer entry={decryptedEntry} />
          ) : entry?.isEncrypted ? (
            <div className="text-center py-12">
              <Lock className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted">This entry is encrypted</p>
              <p className="text-sm text-muted mt-2">
                Content could not be decrypted
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted">No content available</p>
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
          {isEncryptionSetup && entry.isEncrypted ? (
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Encrypted
            </Button>
          ) : (
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
          
          {entry.sharedWith && entry.sharedWith.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setShowShareManagement(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Shares
            </Button>
          )}
          
          <Button
            onClick={() => navigate(`/journal/${entryId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Entry
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
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

      {/* AI Share Dialog */}
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

      {/* Share Management Modal */}
      {showShareManagement && (
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

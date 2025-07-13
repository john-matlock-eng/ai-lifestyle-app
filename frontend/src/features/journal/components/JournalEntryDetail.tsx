import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Brain, 
  Shield, 
  Lock, 
  Calendar, 
  FileText,
  Hash,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import ShareDialog from '../../../components/encryption/ShareDialog';
import AIShareDialog from '../../../components/encryption/AIShareDialog';
import ShareManagement from '../../../components/encryption/ShareManagement';
import { getEncryptionService } from '../../../services/encryption';
import type { JournalEntry } from '@/types/journal';
import { getTemplateIcon, getTemplateName } from '../templates/template-utils';
import { getEmotionById, getEmotionEmoji } from './EmotionSelector/emotionData';
import { shouldTreatAsEncrypted } from '@/utils/encryption-utils';

interface JournalEntryDetailProps {
  entry: JournalEntry;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const JournalEntryDetail: React.FC<JournalEntryDetailProps> = ({
  entry,
  onBack,
  onEdit,
  onDelete,
}) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAIShareDialog, setShowAIShareDialog] = useState(false);
  const [showShareManagement, setShowShareManagement] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  
  const isActuallyEncrypted = shouldTreatAsEncrypted(entry);

  useEffect(() => {
    if (isActuallyEncrypted && entry.encryptedKey) {
      decryptContent();
    }
  }, [entry]); // eslint-disable-line react-hooks/exhaustive-deps

  const decryptContent = async () => {
    try {
      setIsDecrypting(true);
      const encryptionService = getEncryptionService();
      const decrypted = await encryptionService.decryptContent({
        content: entry.content,
        encryptedKey: entry.encryptedKey!,
        iv: entry.encryptionIv!,
      });
      setDecryptedContent(decrypted);
    } catch (error) {
      console.error('Failed to decrypt content:', error);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleShare = async (tokens: Array<{ id: string; recipientEmail: string; permissions: string[]; expiresAt: string }>) => {
    // In a real implementation, this would update the entry's share status
    console.log('Shares created:', tokens);
  };

  const handleAIAnalysis = async (analysisId: string) => {
    // Navigate to AI analysis results
    console.log('AI analysis started:', analysisId);
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
      stressed: { emoji: '😰', label: 'Stressed' }
    };
    
    return legacyMoodMap[mood] || { emoji: '💭', label: mood };
  };

  const displayContent = isActuallyEncrypted ? decryptedContent : entry.content;
  const moodDisplay = getMoodDisplay(entry.mood);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted hover:text-theme mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Journal
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-theme mb-2">{entry.title}</h1>
            
            <div className="flex items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(entry.createdAt), 'MMMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {entry.wordCount} words
              </span>
              <span className="flex items-center gap-1">
                {getTemplateIcon(entry.template)}
                {getTemplateName(entry.template)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mood indicator */}
            {moodDisplay && (
              <div className="flex items-center gap-2 px-3 py-1 bg-surface-muted rounded-lg">
                <span className="text-xl">{moodDisplay.emoji}</span>
                <span className="text-sm text-muted">{moodDisplay.label}</span>
              </div>
            )}

            {/* Encryption indicator */}
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-muted rounded-lg">
              {isActuallyEncrypted ? (
                <>
                  <Lock className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Encrypted</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-muted" />
                  <span className="text-sm text-muted">Not encrypted</span>
                </>
              )}
            </div>

            {/* Actions menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-surface-muted rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-muted" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-surface-muted rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-surface-muted transition-colors text-left"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Entry
                  </button>
                  
                  {isActuallyEncrypted && (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowShareDialog(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-surface-muted transition-colors text-left"
                      >
                        <Share2 className="w-4 h-4" />
                        Share with Friends
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowAIShareDialog(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-surface-muted transition-colors text-left"
                      >
                        <Brain className="w-4 h-4" />
                        AI Analysis
                      </button>
                      
                      {entry.isShared && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowShareManagement(true);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-surface-muted transition-colors text-left"
                        >
                          <Shield className="w-4 h-4" />
                          Manage Shares
                        </button>
                      )}
                    </>
                  )}
                  
                  <hr className="my-1 border-surface-muted" />
                  
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm('Are you sure you want to delete this entry?')) {
                        onDelete();
                      }
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Entry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          {entry.tags.map(tag => (
            <span key={tag} className="tag">
              <Hash className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-8">
        {isDecrypting ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayContent ? (
          <div dangerouslySetInnerHTML={{ __html: displayContent }} />
        ) : (
          <p className="text-muted italic">Content could not be decrypted</p>
        )}
      </div>

      {/* Share status */}
      {entry.isShared && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-800">
            <Share2 className="w-5 h-5" />
            <span className="font-medium">This entry is shared</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Shared with {entry.sharedWith?.length || 0} people
          </p>
          <button
            onClick={() => setShowShareManagement(true)}
            className="text-sm text-blue-600 hover:text-blue-700 mt-2"
          >
            Manage shares →
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-4 text-sm text-muted">
        <p>
          Last updated {formatDistanceToNow(new Date(entry.updatedAt), { addSuffix: true })}
        </p>
      </div>

      {/* Dialogs */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        items={[{
          id: entry.entryId,
          title: entry.title,
          type: 'journal',
          createdAt: entry.createdAt,
          encrypted: isActuallyEncrypted,
        }]}
        onShare={handleShare}
      />

      <AIShareDialog
        isOpen={showAIShareDialog}
        onClose={() => setShowAIShareDialog(false)}
        items={[{
          id: entry.entryId,
          title: entry.title,
          type: 'journal',
          createdAt: entry.createdAt,
          encrypted: isActuallyEncrypted,
        }]}
        onAnalysisComplete={handleAIAnalysis}
      />

      {showShareManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Manage Shares</h2>
                <button
                  onClick={() => setShowShareManagement(false)}
                  className="text-muted hover:text-theme"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <ShareManagement 
                itemType="journal"
                onShareRevoked={() => {
                  // Refresh entry data
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntryDetail;

// JournalEntryDetail.tsx - Fixed version
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
  X,
  AlertCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import ShareDialog from '../../../components/encryption/ShareDialog';
import AIShareDialog from '../../../components/encryption/AIShareDialog';
import ShareManagement from '../../../components/encryption/ShareManagement';
import { getEncryptionService } from '../../../services/encryption';
import { useEncryption } from '../../../contexts/useEncryption';
import type { JournalEntry } from '@/types/journal';
import { getTemplateIcon, getTemplateName } from '../templates/template-utils';
import { getEmotionById, getEmotionEmoji } from './EmotionSelector/emotionData';
import { shouldTreatAsEncrypted } from '@/utils/encryption-utils';
import { JournalEntryRenderer } from './JournalEntryRenderer';

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
  const [decryptedEntry, setDecryptedEntry] = useState<JournalEntry | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  
  // Use the encryption context to ensure encryption is set up
  const { isEncryptionSetup, isEncryptionLocked } = useEncryption();
  
  const isActuallyEncrypted = shouldTreatAsEncrypted(entry);
  const isSharedWithMe = entry.shareAccess !== undefined;

  useEffect(() => {
    if (isActuallyEncrypted && entry.encryptedKey) {
      // Only attempt decryption if encryption is set up and unlocked
      if (isEncryptionSetup && !isEncryptionLocked) {
        decryptContent();
      } else if (isSharedWithMe && !isEncryptionSetup) {
        // If this is a shared entry and encryption isn't set up, show an error
        setDecryptionError('Encryption must be set up to view shared encrypted content. Please set up encryption in your profile.');
      } else if (isEncryptionSetup && isEncryptionLocked) {
        // Encryption is set up but locked
        setDecryptionError('Encryption is locked. Please unlock encryption to view encrypted content.');
      }
    } else {
      setDecryptedEntry(entry);
    }
  }, [entry, isEncryptionSetup, isEncryptionLocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const decryptContent = async () => {
    try {
      setIsDecrypting(true);
      setDecryptionError(null);
      
      const encryptionService = getEncryptionService();
      
      // Check if encryption service is initialized
      const isSetup = await encryptionService.checkSetup();
      if (!isSetup) {
        throw new Error('Encryption not set up. Please set up encryption in your profile to view encrypted content.');
      }
      
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
      
      let errorMessage = 'Failed to decrypt content.';
      if (error instanceof Error) {
        if (error.message.includes('Encryption not initialized') || error.message.includes('Encryption not set up')) {
          errorMessage = 'Encryption must be set up to view encrypted content. Please set up encryption in your profile.';
        } else if (error.message.includes('OperationError')) {
          errorMessage = 'Decryption failed. This may happen if the content was encrypted with a different password.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setDecryptionError(errorMessage);
      setDecryptedEntry(null);
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

  const moodDisplay = getMoodDisplay(entry.mood);

  // Don't allow editing or sharing if this is a shared entry
  const canEdit = !isSharedWithMe;
  const canShare = !isSharedWithMe && isActuallyEncrypted;

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
                  {canEdit && (
                    <>
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
                      
                      {canShare && (
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
                    </>
                  )}
                  
                  {!canEdit && (
                    <div className="px-4 py-2 text-sm text-muted">
                      This is a shared entry
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Access Info */}
      {isSharedWithMe && entry.shareAccess && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-800">
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Shared with you</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Permissions: {entry.shareAccess.permissions.join(', ')}
            {entry.shareAccess.expiresAt && (
              <> • Expires {formatDistanceToNow(new Date(entry.shareAccess.expiresAt), { addSuffix: true })}</>
            )}
          </p>
        </div>
      )}

      {/* Tags - shown at top level, not in renderer */}
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

      {/* Content - Use template renderer */}
      <div className="mb-8">
        {isEncryptionLocked && isActuallyEncrypted ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-medium">Encryption is locked</p>
                <p className="text-yellow-700 text-sm mt-1">Please unlock encryption to view this encrypted content.</p>
              </div>
            </div>
          </div>
        ) : isDecrypting ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : decryptionError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Unable to decrypt content</p>
                <p className="text-red-700 text-sm mt-1">{decryptionError}</p>
              </div>
            </div>
          </div>
        ) : decryptedEntry ? (
          <JournalEntryRenderer entry={decryptedEntry} />
        ) : (
          <p className="text-muted italic">Content not available</p>
        )}
      </div>

      {/* Share status (only for owned entries) */}
      {!isSharedWithMe && entry.isShared && (
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
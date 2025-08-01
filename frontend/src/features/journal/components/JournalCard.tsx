// JournalCard.tsx
import React from "react";
import {
  Calendar,
  FileText,
  Lock,
  Unlock,
  Hash,
  Target,
  Share2,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { JournalEntry } from "@/types/journal";
import { getTemplateIcon, getTemplateName } from "../templates/template-utils";
import { getEmotionById, getEmotionEmoji } from "./EmotionSelector/emotionData";
import {
  shouldTreatAsEncrypted,
  getSafeExcerpt,
} from "@/utils/encryption-utils";

interface JournalCardProps {
  entry: JournalEntry;
  onClick: () => void;
  onShare?: () => void;
  className?: string;
}

const JournalCard: React.FC<JournalCardProps> = ({
  entry,
  onClick,
  onShare,
  className = "",
}) => {
  const getMoodDisplay = (mood?: string) => {
    if (!mood) return null;

    // Check if it's a new emotion ID from the emotion wheel
    const emotion = getEmotionById(mood);
    if (emotion) {
      return {
        emoji: getEmotionEmoji(mood),
        label: emotion.label,
      };
    }

    // Fallback for old mood values
    const legacyMoodMap: Record<string, { emoji: string; label: string }> = {
      amazing: { emoji: "🤩", label: "Amazing" },
      good: { emoji: "😊", label: "Good" },
      okay: { emoji: "😐", label: "Okay" },
      stressed: { emoji: "😰", label: "Stressed" },
    };

    return legacyMoodMap[mood] || { emoji: "💭", label: mood };
  };

  // Check if content is actually encrypted
  const isActuallyEncrypted = shouldTreatAsEncrypted(entry);

  return (
    <div
      onClick={onClick}
      className={`
        journal-card group relative overflow-hidden
        p-6 rounded-xl border cursor-pointer
        transition-all duration-300 transform
        hover:scale-[1.02] hover:shadow-lg
        bg-surface border-surface-muted hover:border-accent/50
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-theme line-clamp-1 group-hover:text-accent transition-colors">
            {entry.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(entry.createdAt), {
                addSuffix: true,
              })}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {entry.wordCount} words
            </span>
          </div>
        </div>

        {/* Mood & Status indicators */}
        <div className="flex items-center gap-2">
          {entry.mood &&
            (() => {
              const moodDisplay = getMoodDisplay(entry.mood);
              return (
                moodDisplay && (
                  <span
                    className="text-lg"
                    title={`Feeling ${moodDisplay.label.toLowerCase()}`}
                  >
                    {moodDisplay.emoji}
                  </span>
                )
              );
            })()}
          {entry.sharedWith && entry.sharedWith.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs">
              <Users className="w-3 h-3" />
              <span>{entry.sharedWith.length}</span>
            </div>
          )}
          {isActuallyEncrypted ? (
            <div
              className="p-1.5 bg-accent/20 rounded-lg"
              title="Encrypted entry"
            >
              <Lock className="w-4 h-4 text-accent" />
            </div>
          ) : (
            <Unlock className="w-4 h-4 text-muted/30" />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isActuallyEncrypted && onShare && (
        <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="p-2 rounded-lg bg-surface-muted hover:bg-accent/10 hover:text-accent transition-colors"
            title="Share Entry"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content Preview */}
      <p className="text-sm text-muted line-clamp-3 mb-3">
        {getSafeExcerpt(
          entry.content,
          entry.isEncrypted,
          150,
          entry.encryptedKey,
          entry.encryptionIv,
        )}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        {/* Template */}
        <div className="flex items-center gap-2">
          <span className="text-sm">{getTemplateIcon(entry.template)}</span>
          <span className="text-xs text-muted">
            {getTemplateName(entry.template)}
          </span>
        </div>

        {/* Tags, Goals, and Sharing */}
        <div className="flex items-center gap-2">
          {entry.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag tag-xs">
              <Hash className="w-2 h-2" />
              {tag}
            </span>
          ))}
          {entry.tags.length > 2 && (
            <span className="text-xs text-muted">+{entry.tags.length - 2}</span>
          )}
          {entry.linkedGoalIds.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-accent">
              <Target className="w-3 h-3" />
              {entry.linkedGoalIds.length}
            </span>
          )}
          {entry.isShared && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <Share2 className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

export default JournalCard;

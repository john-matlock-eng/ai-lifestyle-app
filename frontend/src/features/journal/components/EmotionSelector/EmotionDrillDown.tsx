// EmotionDrillDown.tsx
import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Check, X } from "lucide-react";
import {
  getCoreEmotions,
  getSecondaryEmotions,
  getTertiaryEmotions,
  getEmotionById,
  getEmotionEmoji,
  getEmotionPath,
} from "./emotionData";

interface EmotionDrillDownProps {
  selectedEmotions: string[];
  onEmotionToggle: (emotionId: string) => void;
  className?: string;
}

const EmotionDrillDown: React.FC<EmotionDrillDownProps> = ({
  selectedEmotions,
  onEmotionToggle,
  className = "",
}) => {
  const [currentLevel, setCurrentLevel] = useState<
    "core" | "secondary" | "tertiary"
  >("core");
  const [selectedCore, setSelectedCore] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(
    null,
  );

  const handleCoreSelect = (emotionId: string) => {
    setSelectedCore(emotionId);
    setSelectedSecondary(null);
    setCurrentLevel("secondary");
  };

  const handleSecondarySelect = (emotionId: string) => {
    const tertiaryEmotions = getTertiaryEmotions(emotionId);

    if (tertiaryEmotions.length > 0) {
      setSelectedSecondary(emotionId);
      setCurrentLevel("tertiary");
    } else {
      // No tertiary emotions, just toggle this one
      onEmotionToggle(emotionId);
    }
  };

  const handleBack = () => {
    if (currentLevel === "tertiary") {
      setCurrentLevel("secondary");
      setSelectedSecondary(null);
    } else if (currentLevel === "secondary") {
      setCurrentLevel("core");
      setSelectedCore(null);
    }
  };

  const getCurrentEmotions = () => {
    if (currentLevel === "core") {
      return getCoreEmotions();
    } else if (currentLevel === "secondary" && selectedCore) {
      return getSecondaryEmotions(selectedCore);
    } else if (currentLevel === "tertiary" && selectedSecondary) {
      return getTertiaryEmotions(selectedSecondary);
    }
    return [];
  };

  const getBreadcrumbs = () => {
    const crumbs = ["Core"];
    if (selectedCore) {
      const coreEmotion = getEmotionById(selectedCore);
      if (coreEmotion) crumbs.push(coreEmotion.label);
    }
    if (selectedSecondary) {
      const secEmotion = getEmotionById(selectedSecondary);
      if (secEmotion) crumbs.push(secEmotion.label);
    }
    return crumbs;
  };

  const currentEmotions = getCurrentEmotions();
  const breadcrumbs = getBreadcrumbs();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Navigation breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {currentLevel !== "core" && (
          <button
            onClick={handleBack}
            className="p-1 rounded hover:bg-surface-hover transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-1">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="w-3 h-3 text-muted" />}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-medium"
                    : "text-muted"
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Current level emotions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {currentEmotions.map((emotion) => {
          const isSelected = selectedEmotions.includes(emotion.id);
          const hasChildren =
            currentLevel === "core"
              ? getSecondaryEmotions(emotion.id).length > 0
              : currentLevel === "secondary"
                ? getTertiaryEmotions(emotion.id).length > 0
                : false;

          return (
            <button
              key={emotion.id}
              onClick={() => {
                if (currentLevel === "core") {
                  handleCoreSelect(emotion.id);
                } else if (currentLevel === "secondary") {
                  handleSecondarySelect(emotion.id);
                } else {
                  onEmotionToggle(emotion.id);
                }
              }}
              className={`
                emotion-list-item relative flex items-center justify-between gap-2 p-3 rounded-lg
                border transition-all duration-200 group
                ${
                  isSelected
                    ? "border-accent bg-accent/10"
                    : "border-surface-muted hover:border-accent/50 hover:bg-surface-hover"
                }
              `}
              style={{
                borderColor: isSelected ? emotion.color : undefined,
                backgroundColor: isSelected ? emotion.color + "15" : undefined,
              }}
            >
              <div className="flex items-center gap-2 flex-1 text-left">
                <span className="text-lg">{getEmotionEmoji(emotion.id)}</span>
                <span
                  className={`text-sm font-medium ${isSelected ? "text-theme" : "text-muted"}`}
                >
                  {emotion.label}
                </span>
              </div>
              {hasChildren && (
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-theme transition-colors" />
              )}
              {isSelected && !hasChildren && (
                <Check className="w-4 h-4" style={{ color: emotion.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick toggle for secondary/tertiary emotions */}
      {(currentLevel === "secondary" || currentLevel === "tertiary") && (
        <div className="pt-2 border-t border-surface-muted">
          <p className="text-xs text-muted mb-2">
            {currentLevel === "secondary"
              ? "Select an emotion to see more specific options, or click the checkmark to select it"
              : "Select specific emotions that resonate with you"}
          </p>
          <div className="flex flex-wrap gap-2">
            {currentEmotions.map((emotion) => {
              const isSelected = selectedEmotions.includes(emotion.id);
              const hasChildren =
                currentLevel === "secondary" &&
                getTertiaryEmotions(emotion.id).length > 0;

              if (hasChildren) return null; // Don't show quick toggle for emotions with children

              return (
                <button
                  key={emotion.id}
                  onClick={() => onEmotionToggle(emotion.id)}
                  className={`
                    emotion-pill inline-flex items-center gap-1 px-2 py-1 rounded-full
                    text-xs font-medium transition-all duration-200
                    ${isSelected ? "ring-1" : "hover:opacity-80"}
                  `}
                  style={{
                    backgroundColor: emotion.color + (isSelected ? "30" : "20"),
                    color: emotion.color,
                    borderColor: emotion.color,
                  }}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  {emotion.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected emotions summary */}
      {selectedEmotions.length > 0 && (
        <div className="p-3 bg-surface rounded-lg border border-surface-muted">
          <p className="text-sm font-medium mb-2">
            Selected emotions ({selectedEmotions.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedEmotions.map((emotionId) => {
              const emotion = getEmotionById(emotionId);
              if (!emotion) return null;
              const path = getEmotionPath(emotionId);

              return (
                <div
                  key={emotionId}
                  className="emotion-pill inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: emotion.color + "20",
                    color: emotion.color,
                    border: `1px solid ${emotion.color}`,
                  }}
                >
                  <span>{getEmotionEmoji(emotionId)}</span>
                  <span className="font-medium">{emotion.label}</span>
                  {path.length > 1 && (
                    <span className="text-[10px] opacity-70">
                      (
                      {path
                        .slice(0, -1)
                        .map((e) => e.label)
                        .join(" → ")}
                      )
                    </span>
                  )}
                  <button
                    onClick={() => onEmotionToggle(emotionId)}
                    className="ml-1 hover:opacity-70 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionDrillDown;

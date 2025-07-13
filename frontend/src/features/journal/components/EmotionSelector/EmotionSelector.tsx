// EmotionSelector.tsx
import React, { useState } from 'react';
import { Grid3X3, List } from 'lucide-react';
import EmotionWheel from './EmotionWheel';
import EmotionDrillDown from './EmotionDrillDown';
import { getEmotionById } from './emotionData';
import './emotion-selector.css';

interface EmotionSelectorProps {
  value: string[];
  onChange: (emotions: string[]) => void;
  mode?: 'wheel' | 'list' | 'both';
  className?: string;
  maxSelections?: number;
}

const EmotionSelector: React.FC<EmotionSelectorProps> = ({ 
  value, 
  onChange,
  mode = 'both',
  className = '',
  maxSelections
}) => {
  const [viewMode, setViewMode] = useState<'wheel' | 'list'>(
    mode === 'both' ? 'list' : mode
  );
  
  const handleEmotionToggle = (emotionId: string) => {
    if (value.includes(emotionId)) {
      onChange(value.filter(id => id !== emotionId));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        // Optionally show a message that max selections reached
        return;
      }
      onChange([...value, emotionId]);
    }
  };
  
  const getSummaryText = () => {
    if (value.length === 0) return 'No emotions selected';
    if (value.length === 1) {
      const emotion = getEmotionById(value[0]);
      return emotion ? `Feeling ${emotion.label.toLowerCase()}` : '';
    }
    
    const emotions = value.map(id => getEmotionById(id)).filter(Boolean);
    if (emotions.length === 2) {
      return `Feeling ${emotions[0]?.label.toLowerCase()} and ${emotions[1]?.label.toLowerCase()}`;
    }
    
    return `Feeling ${emotions.slice(0, -1).map(e => e?.label.toLowerCase()).join(', ')}, and ${emotions[emotions.length - 1]?.label.toLowerCase()}`;
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-theme">How are you feeling?</h3>
          <p className="text-xs text-muted mt-1">
            {maxSelections 
              ? `Select up to ${maxSelections} emotion${maxSelections > 1 ? 's' : ''}`
              : 'Select all emotions that resonate with you'
            }
          </p>
        </div>
        
        {mode === 'both' && (
          <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-surface-muted">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-accent text-white' 
                  : 'text-muted hover:text-theme hover:bg-surface-hover'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('wheel')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'wheel' 
                  ? 'bg-accent text-white' 
                  : 'text-muted hover:text-theme hover:bg-surface-hover'
              }`}
              title="Wheel view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Emotion selector */}
      {viewMode === 'wheel' ? (
        <EmotionWheel
          selectedEmotions={value}
          onEmotionToggle={handleEmotionToggle}
        />
      ) : (
        <EmotionDrillDown
          selectedEmotions={value}
          onEmotionToggle={handleEmotionToggle}
        />
      )}
      
      {/* Summary */}
      {value.length > 0 && (
        <div className="text-sm text-muted italic">
          {getSummaryText()}
        </div>
      )}
    </div>
  );
};

export default EmotionSelector;
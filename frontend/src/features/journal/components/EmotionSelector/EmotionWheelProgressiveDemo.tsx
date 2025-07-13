// EmotionWheelProgressiveDemo.tsx - Demo of progressive emotion selection
import React, { useState } from 'react';
import EmotionWheel from './EmotionWheel';
import { getEmotionById, getEmotionEmoji } from './emotionData';

const EmotionWheelProgressiveDemo: React.FC = () => {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [completedSelections, setCompletedSelections] = useState<string[][]>([]);
  const [progressiveReveal, setProgressiveReveal] = useState(true);

  const handleEmotionToggle = (emotionId: string) => {
    setSelectedEmotions(prev => {
      if (prev.includes(emotionId)) {
        return prev.filter(id => id !== emotionId);
      } else {
        return [...prev, emotionId];
      }
    });
  };

  const handleComplete = () => {
    if (selectedEmotions.length > 0) {
      setCompletedSelections(prev => [...prev, [...selectedEmotions]]);
      setSelectedEmotions([]);
    }
  };

  const clearAll = () => {
    setSelectedEmotions([]);
    setCompletedSelections([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="bg-surface rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Emotion Wheel - Progressive Reveal Demo</h1>
        
        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={progressiveReveal}
              onChange={(e) => setProgressiveReveal(e.target.checked)}
              className="rounded"
            />
            <span className="font-medium">Progressive Reveal Mode</span>
          </label>
          <button
            onClick={clearAll}
            className="px-3 py-1 bg-surface-hover rounded-lg text-sm hover:bg-surface-muted transition-colors"
          >
            Clear All
          </button>
        </div>
        
        {progressiveReveal && (
          <div className="mb-4 p-4 bg-accent/10 rounded-lg">
            <h3 className="font-semibold mb-2">How Progressive Reveal Works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Select a <strong>core emotion</strong> (center of wheel) to begin</li>
              <li>Secondary emotions for that core will appear - select one</li>
              <li>Tertiary emotions for that secondary will appear - select one or more</li>
              <li>Click "Complete Selection" or "Add Another Emotion" to continue</li>
            </ol>
          </div>
        )}
        
        <EmotionWheel
          selectedEmotions={selectedEmotions}
          onEmotionToggle={handleEmotionToggle}
          progressiveReveal={progressiveReveal}
          onComplete={handleComplete}
          className="mb-6"
        />
        
        {/* Currently selected emotions */}
        {selectedEmotions.length > 0 && (
          <div className="mt-6 p-4 bg-surface-hover rounded-lg">
            <h3 className="font-semibold mb-2">Current Selection:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedEmotions.map(emotionId => {
                const emotion = getEmotionById(emotionId);
                if (!emotion) return null;
                return (
                  <span
                    key={emotionId}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: emotion.color + '30',
                      color: emotion.color,
                      border: `1px solid ${emotion.color}`
                    }}
                  >
                    <span>{getEmotionEmoji(emotionId)}</span>
                    {emotion.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Completed selections */}
        {completedSelections.length > 0 && (
          <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/30">
            <h3 className="font-semibold mb-2 text-success">Completed Selections:</h3>
            <div className="space-y-2">
              {completedSelections.map((selection, index) => (
                <div key={index} className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted">#{index + 1}:</span>
                  {selection.map(emotionId => {
                    const emotion = getEmotionById(emotionId);
                    if (!emotion) return null;
                    return (
                      <span
                        key={emotionId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: emotion.color + '20',
                          color: emotion.color
                        }}
                      >
                        <span>{getEmotionEmoji(emotionId)}</span>
                        {emotion.label}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionWheelProgressiveDemo;

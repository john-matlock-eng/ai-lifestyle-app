// EmotionWheelDemo.tsx - Demo to test the emotion wheel fixes
import React, { useState } from 'react';
import EmotionWheel from './EmotionWheel';

const EmotionWheelDemo: React.FC = () => {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  
  const handleEmotionToggle = (emotionId: string) => {
    if (selectedEmotions.includes(emotionId)) {
      setSelectedEmotions(selectedEmotions.filter(id => id !== emotionId));
    } else {
      setSelectedEmotions([...selectedEmotions, emotionId]);
    }
  };
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-theme mb-2">Emotion Wheel Demo</h1>
        
        <div className="bg-surface rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">New Features:</h2>
          <ul className="space-y-1 text-sm text-muted">
            <li>• Press <kbd className="px-2 py-1 bg-surface-hover rounded text-xs">ESC</kbd> to reset zoom</li>
            <li>• Click outside the wheel to reset zoom</li>
            <li>• Zoom controls are now always visible (positioned above the wheel)</li>
            <li>• Added reset zoom button</li>
            <li>• Smooth zoom transitions</li>
          </ul>
        </div>
        
        <EmotionWheel
          selectedEmotions={selectedEmotions}
          onEmotionToggle={handleEmotionToggle}
        />
        
        <div className="bg-surface rounded-lg p-4 mt-6">
          <p className="text-sm text-muted">
            Try zooming in and then pressing ESC or clicking outside the wheel. 
            The zoom controls remain accessible even when zoomed in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmotionWheelDemo;

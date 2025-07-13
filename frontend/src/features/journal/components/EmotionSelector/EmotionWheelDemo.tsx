// EmotionWheelDemo.tsx - Demo to test the emotion wheel fixes
import React, { useState } from 'react';
import EmotionWheel from './EmotionWheel';

const EmotionWheelDemo: React.FC = () => {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [hierarchicalSelection, setHierarchicalSelection] = useState(true);
  
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
          <h2 className="text-lg font-semibold mb-2">Enhanced Features:</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2 text-accent">🔍 Zoom Controls</h3>
              <ul className="space-y-1 text-sm text-muted">
                <li>• Use buttons or <strong>mouse wheel</strong> to zoom</li>
                <li>• Zoom up to <strong>4x</strong> for detailed view</li>
                <li>• Zoom controls always stay visible</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-accent">🖐️ Pan & Navigation</h3>
              <ul className="space-y-1 text-sm text-muted">
                <li>• <strong>Drag to pan</strong> when zoomed in</li>
                <li>• <strong>No accidental selections</strong> when dragging</li>
                <li>• Works with <strong>mouse and touch</strong></li>
                <li>• Press <kbd className="px-2 py-1 bg-surface-hover rounded text-xs">ESC</kbd> to reset view</li>
                <li>• Click outside to reset</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-accent/10 rounded-lg">
            <p className="text-sm">
              <strong>Try it:</strong> Zoom in with the buttons or scroll wheel, then drag the wheel around to explore different emotions!
            </p>
          </div>
        </div>
        
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hierarchical"
              checked={hierarchicalSelection}
              onChange={(e) => setHierarchicalSelection(e.target.checked)}
              className="rounded border-surface-muted text-accent focus:ring-accent"
            />
            <label htmlFor="hierarchical" className="text-sm cursor-pointer">
              Enable hierarchical selection
              <span className="text-xs text-muted ml-2">
                (auto-selects parent emotions)
              </span>
            </label>
          </div>
          
          {selectedEmotions.length > 0 && (
            <button
              onClick={() => setSelectedEmotions([])}
              className="text-sm text-muted hover:text-theme transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        
        <EmotionWheel
          selectedEmotions={selectedEmotions}
          onEmotionToggle={handleEmotionToggle}
          hierarchicalSelection={hierarchicalSelection}
        />
        
        <div className="bg-surface rounded-lg p-4 mt-6">
          <h3 className="font-medium mb-2">Latest Updates:</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span><strong>Hierarchical Selection:</strong> Selecting a specific emotion auto-selects its parent emotions for logical grouping.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span><strong>Smart Tooltips:</strong> Hover tooltips now stay within screen boundaries - try hovering over emotions near the edges!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span><strong>Pan & Zoom:</strong> Zoom up to 4x and drag to explore. Scroll to zoom, ESC to reset.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span><strong>Guided Selection:</strong> Core emotions pulse when empty, encouraging logical emotion selection flow.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmotionWheelDemo;

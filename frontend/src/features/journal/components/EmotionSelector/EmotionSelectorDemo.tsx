// EmotionSelectorDemo.tsx
import React, { useState } from 'react';
import EmotionSelector from './EmotionSelector';

const EmotionSelectorDemo: React.FC = () => {
  const [demo1Emotions, setDemo1Emotions] = useState<string[]>([]);
  const [demo2Emotions, setDemo2Emotions] = useState<string[]>([]);
  const [demo3Emotions, setDemo3Emotions] = useState<string[]>([]);
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-theme mb-2">
            Emotion Selector Component
          </h1>
          <p className="text-muted">
            A reusable component for selecting emotions with both wheel and drill-down interfaces
          </p>
        </div>
        
        {/* Demo 1: Both modes available */}
        <div className="bg-surface rounded-lg shadow-lg p-6 border border-surface-muted">
          <h2 className="text-xl font-semibold mb-4">Full Feature Demo (Both Modes)</h2>
          <EmotionSelector
            value={demo1Emotions}
            onChange={setDemo1Emotions}
            mode="both"
          />
        </div>
        
        {/* Demo 2: List mode only with max selections */}
        <div className="bg-surface rounded-lg shadow-lg p-6 border border-surface-muted">
          <h2 className="text-xl font-semibold mb-4">List Mode Only (Max 3 Emotions)</h2>
          <EmotionSelector
            value={demo2Emotions}
            onChange={setDemo2Emotions}
            mode="list"
            maxSelections={3}
          />
        </div>
        
        {/* Demo 3: Wheel mode only */}
        <div className="bg-surface rounded-lg shadow-lg p-6 border border-surface-muted">
          <h2 className="text-xl font-semibold mb-4">Wheel Mode Only</h2>
          <EmotionSelector
            value={demo3Emotions}
            onChange={setDemo3Emotions}
            mode="wheel"
          />
        </div>
        
        {/* Usage Example */}
        <div className="bg-surface rounded-lg shadow-lg p-6 border border-surface-muted">
          <h2 className="text-xl font-semibold mb-4">Usage Example</h2>
          <pre className="text-sm bg-surface-hover p-4 rounded-lg overflow-x-auto">
            <code>{`import { EmotionSelector } from '@/features/journal/components';

const MyComponent = () => {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  
  return (
    <EmotionSelector
      value={selectedEmotions}
      onChange={setSelectedEmotions}
      mode="both"              // 'wheel' | 'list' | 'both'
      maxSelections={5}        // optional: limit selections
    />
  );
};`}</code>
          </pre>
        </div>
        
        {/* Integration with Journal Templates */}
        <div className="bg-surface rounded-lg shadow-lg p-6 border border-surface-muted">
          <h2 className="text-xl font-semibold mb-4">Integration with Journal Templates</h2>
          <p className="text-sm text-muted mb-4">
            The emotion selector has been integrated into the journal templates. Here's how it works:
          </p>
          <pre className="text-sm bg-surface-hover p-4 rounded-lg overflow-x-auto">
            <code>{`// In enhanced-templates.ts
{
  id: 'emotions',
  title: "Today's Emotions",
  prompt: 'How are you feeling?',
  type: 'emotions',
  required: true,
  options: {
    maxSelections: 5,
    mode: 'both'
  }
},

// The template extractor converts emotions to:
// - mood: first selected emotion (for compatibility)
// - tags: emotion-{id} for each selected emotion`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default EmotionSelectorDemo;
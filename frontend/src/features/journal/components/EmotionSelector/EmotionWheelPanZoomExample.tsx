// EmotionWheelPanZoomExample.tsx - Quick example of the enhanced emotion wheel
import React, { useState } from "react";
import EmotionWheel from "./EmotionWheel";

const EmotionWheelPanZoomExample: React.FC = () => {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([
    "happy",
    "excited",
  ]);

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Interactive Emotion Wheel</h1>
          <p className="text-muted">Zoom up to 4x and drag to explore!</p>
        </div>

        {/* Quick controls guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🖱️</div>
            <h3 className="font-semibold">Mouse Controls</h3>
            <p className="text-sm text-muted">Scroll to zoom, drag to pan</p>
          </div>
          <div className="bg-surface rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">👆</div>
            <h3 className="font-semibold">Touch Controls</h3>
            <p className="text-sm text-muted">Drag to pan when zoomed</p>
          </div>
          <div className="bg-surface rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">⌨️</div>
            <h3 className="font-semibold">Keyboard</h3>
            <p className="text-sm text-muted">ESC to reset view</p>
          </div>
        </div>

        {/* The emotion wheel */}
        <EmotionWheel
          selectedEmotions={selectedEmotions}
          onEmotionToggle={(emotionId) => {
            setSelectedEmotions((prev) =>
              prev.includes(emotionId)
                ? prev.filter((id) => id !== emotionId)
                : [...prev, emotionId],
            );
          }}
        />

        {/* Stats */}
        <div className="mt-8 flex justify-center gap-8 text-sm text-muted">
          <div>
            <span className="font-semibold">{selectedEmotions.length}</span>{" "}
            emotions selected
          </div>
          <div>
            <span className="font-semibold">4x</span> max zoom
          </div>
          <div>
            <span className="font-semibold">360°</span> panable area
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionWheelPanZoomExample;

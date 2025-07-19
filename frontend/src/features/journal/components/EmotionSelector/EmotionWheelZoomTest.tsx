// EmotionWheelZoomTest.tsx - Test for zoom controls positioning
import React, { useState } from "react";
import EmotionSelector from "./EmotionSelector";

const EmotionWheelZoomTest: React.FC = () => {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="bg-surface rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4">
          Emotion Wheel - Zoom Controls Test
        </h1>

        <p className="text-sm text-muted mb-6">
          The zoom controls should now be positioned inside the wheel container
          (top-right corner) and should not overlap with the view toggle
          buttons.
        </p>

        <EmotionSelector
          value={selectedEmotions}
          onChange={setSelectedEmotions}
          mode="both" // Shows the view toggle buttons
          progressiveReveal={true}
        />

        <div className="mt-6 p-4 bg-accent/10 rounded-lg">
          <h3 className="font-semibold mb-2">What was fixed:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              Zoom controls moved from above the container (-top-12) to inside
              (top-2 right-2)
            </li>
            <li>Removed extra padding-top from the wheel container</li>
            <li>
              Added semi-transparent background to zoom controls for better
              visibility
            </li>
            <li>
              Controls now have a subtle blur effect and border for visual
              separation
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmotionWheelZoomTest;

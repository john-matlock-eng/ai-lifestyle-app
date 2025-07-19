// EmotionWheelTestScenarios.tsx - Test all the fixes
import React, { useState } from "react";
import EmotionWheel from "./EmotionWheel";

const EmotionWheelTestScenarios: React.FC = () => {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const handleEmotionToggle = (emotionId: string) => {
    if (selectedEmotions.includes(emotionId)) {
      setSelectedEmotions(selectedEmotions.filter((id) => id !== emotionId));
    } else {
      setSelectedEmotions([...selectedEmotions, emotionId]);
    }
  };

  const tests = [
    {
      id: "zoom-controls",
      name: "Zoom controls stay visible",
      description: "Zoom in to 4x - controls should remain accessible",
    },
    {
      id: "escape-reset",
      name: "ESC key resets view",
      description: "Zoom and pan, then press ESC",
    },
    {
      id: "drag-pan",
      name: "Drag to pan without selection",
      description: "Zoom in, then drag - should pan without selecting",
    },
    {
      id: "tooltip-bounds",
      name: "Tooltips stay on screen",
      description: "Hover over emotions near edges",
    },
    {
      id: "tooltip-update",
      name: "Tooltip updates on hover",
      description: "Move cursor between emotions - tooltip should update",
    },
    {
      id: "scroll-zoom",
      name: "Scroll zoom works",
      description: "Use mouse wheel to zoom - no console errors",
    },
    {
      id: "hierarchical",
      name: "Hierarchical selection",
      description: "Click outer emotion - parents auto-select",
    },
    {
      id: "click-select",
      name: "Click to select",
      description: "Single click should select emotion",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Emotion Wheel Test Scenarios
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Test checklist */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Test Checklist</h2>
            <div className="space-y-2">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-surface rounded-lg p-4 border border-surface-muted"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={test.id}
                      checked={testResults[test.id] || false}
                      onChange={(e) =>
                        setTestResults({
                          ...testResults,
                          [test.id]: e.target.checked,
                        })
                      }
                      className="mt-1 rounded border-surface-muted text-accent focus:ring-accent"
                    />
                    <label htmlFor={test.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{test.name}</div>
                      <div className="text-sm text-muted mt-1">
                        {test.description}
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Test summary */}
            <div className="mt-6 p-4 bg-surface rounded-lg">
              <div className="text-sm font-medium mb-2">Test Progress</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{
                      width: `${(Object.values(testResults).filter(Boolean).length / tests.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-muted">
                  {Object.values(testResults).filter(Boolean).length}/
                  {tests.length}
                </span>
              </div>
            </div>
          </div>

          {/* Emotion wheel */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Test Area</h2>
            <EmotionWheel
              selectedEmotions={selectedEmotions}
              onEmotionToggle={handleEmotionToggle}
              hierarchicalSelection={true}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-accent/10 border border-accent/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Go through each test scenario</li>
            <li>Check the box when the feature works correctly</li>
            <li>All tests should pass without console errors</li>
            <li>Pay special attention to drag vs click behavior</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default EmotionWheelTestScenarios;

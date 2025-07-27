import React from "react";
import { AnimatedShihTzu } from "../common";
import { useShihTzuCompanion } from "../../hooks/useShihTzuCompanion";

/**
 * Example component showing how to integrate the AnimatedShihTzu
 * into your lifestyle app features
 */
export const ShihTzuCompanionExample: React.FC = () => {
  const {
    mood,
    position,
    setPosition,
    celebrate,
    showCuriosity,
    startJournaling,
    walk,
  } = useShihTzuCompanion({
    initialPosition: { x: 200, y: 200 },
  });

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 40; // Center the dog
    const y = e.clientY - rect.top - 40;

    walk(); // Start walking animation
    setTimeout(() => setPosition({ x, y }), 100); // Then move
  };

  // Example: Integrate with your goals system
  const onGoalCompleted = () => {
    celebrate();
    // Your goal completion logic here
  };

  // Example: Integrate with journaling
  const onStartJournaling = () => {
    startJournaling();
    // Your journaling start logic here
  };

  // Example: Show tips or onboarding
  const onShowTip = () => {
    showCuriosity();
    // Your tip display logic here
  };

  return (
    <div className="relative w-full h-screen bg-gray-50">
      {/* Example Integration Points */}
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">Shih Tzu Companion Integration</h2>

        <div className="flex gap-4">
          <button
            onClick={onGoalCompleted}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Simulate Goal Completion
          </button>

          <button
            onClick={onStartJournaling}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start Journaling
          </button>

          <button
            onClick={onShowTip}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Show Tip
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Click anywhere on the screen to move the companion!
        </p>
      </div>

      {/* Click area for movement */}
      <div className="absolute inset-0" onClick={handleBackgroundClick} />

      {/* The Shih Tzu Companion */}
      <AnimatedShihTzu
        mood={mood}
        position={position}
        onPositionChange={setPosition}
      />
    </div>
  );
};

export default ShihTzuCompanionExample;

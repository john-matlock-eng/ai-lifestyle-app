import React from "react";
import { useNavigate } from "react-router-dom";
import { useHabits } from "../hooks/useHabits";
import { HabitForm } from "../components/HabitForm";
import type { CreateHabitRequest, UpdateHabitRequest } from "@/types/habits";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/common";
// TODO: Add toast notifications

export const CreateHabitPage: React.FC = () => {
  const navigate = useNavigate();
  const { createHabit, isCreating } = useHabits();

  const handleSubmit = async (
    data: CreateHabitRequest | UpdateHabitRequest,
  ) => {
    try {
      // For create page, we know it's always CreateHabitRequest
      await createHabit(data as CreateHabitRequest);
      // TODO: Show success notification
      navigate("/habits");
    } catch (error) {
      console.error("Failed to create habit:", error);
      // TODO: Show error notification
    }
  };

  const handleCancel = () => {
    navigate("/habits");
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/habits")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Habits
        </Button>
      </div>

      {/* Form Container */}
      <div className="bg-gray-50 rounded-lg p-6">
        <HabitForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isCreating}
        />
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tips for Creating Effective Habits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">🎯 Start Small</h4>
            <p className="text-sm text-gray-600">
              Begin with habits that take 5 minutes or less. You can always
              increase the difficulty once the habit is established.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">📅 Be Specific</h4>
            <p className="text-sm text-gray-600">
              Instead of "Exercise more," try "10 push-ups after morning
              coffee." Specific habits are easier to track.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">⏰ Set a Time</h4>
            <p className="text-sm text-gray-600">
              Linking your habit to a specific time or existing routine
              increases the chances of success.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">
              🌟 Focus on Identity
            </h4>
            <p className="text-sm text-gray-600">
              Frame habits around who you want to become: "I'm someone who
              meditates" rather than "I need to meditate."
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Pro tip:</strong> Research shows it takes an average of 66
            days to form a new habit. Be patient with yourself and focus on
            consistency over perfection!
          </p>
        </div>
      </div>
    </div>
  );
};

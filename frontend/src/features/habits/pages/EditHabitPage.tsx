import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useHabits } from "../hooks/useHabits";
import { HabitForm } from "../components/HabitForm";
import type { UpdateHabitRequest, Habit } from "@/types/habits";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/common";
// TODO: Add toast notifications
import { habitService } from "../services/habitService";

export const EditHabitPage: React.FC = () => {
  const navigate = useNavigate();
  const { habitId } = useParams<{ habitId: string }>();
  const { updateHabit, deleteHabit, isUpdating, isDeleting } = useHabits();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadHabit = async () => {
      if (!habitId) {
        navigate("/habits");
        return;
      }

      try {
        setIsLoading(true);
        const habitData = await habitService.getHabit(habitId);
        setHabit(habitData);
      } catch (error) {
        console.error("Failed to load habit:", error);
        // TODO: Show error notification
        navigate("/habits");
      } finally {
        setIsLoading(false);
      }
    };

    loadHabit();
  }, [habitId, navigate]);

  const handleSubmit = async (data: UpdateHabitRequest) => {
    if (!habitId) return;

    try {
      await updateHabit(habitId, data);
      // TODO: Show success notification
      navigate("/habits");
    } catch (error) {
      console.error("Failed to update habit:", error);
      // TODO: Show error notification
    }
  };

  const handleDelete = async () => {
    if (!habitId) return;

    try {
      await deleteHabit(habitId);
      // TODO: Show success notification
      navigate("/habits");
    } catch (error) {
      console.error("Failed to delete habit:", error);
      // TODO: Show error notification
    }
  };

  const handleCancel = () => {
    navigate("/habits");
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!habit) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with back button and delete */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/habits")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Habits
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Habit
        </Button>
      </div>

      {/* Form Container */}
      <div className="bg-gray-50 rounded-lg p-6">
        <HabitForm
          habit={habit}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isUpdating}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Habit?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{habit.title}"? This action
              cannot be undone. All progress and history for this habit will be
              permanently removed.
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                isLoading={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                Delete Habit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Habit Statistics */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Habit Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Current Streak</p>
            <p className="text-2xl font-bold text-gray-900">
              {habit.currentStreak} days
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Longest Streak</p>
            <p className="text-2xl font-bold text-gray-900">
              {habit.longestStreak} days
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Points</p>
            <p className="text-2xl font-bold text-gray-900">{habit.points}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(habit.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">
            This Week's Progress
          </h4>
          <div className="flex justify-between">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
              const isCompleted = habit.weekProgress[index];
              return (
                <div key={index} className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">{day}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted && "✓"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

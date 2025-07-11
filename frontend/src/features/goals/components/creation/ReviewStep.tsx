import React from 'react';
import type { CreateGoalRequest } from '../../types/api.types';
import { GOAL_PATTERNS, GOAL_CATEGORIES } from '../../types/ui.types';
import Button from '../../../../components/common/Button';

interface ReviewStepProps {
  goalData: CreateGoalRequest;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ goalData, onSubmit, isSubmitting }) => {
  const pattern = GOAL_PATTERNS[goalData.goalPattern];
  const category = GOAL_CATEGORIES.find(c => c.value === goalData.category);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[var(--text)] mb-4">Review Your Goal</h3>
        <p className="text-sm text-muted">
          Make sure everything looks good before creating your goal.
        </p>
      </div>

      {/* Goal Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        {/* Pattern Badge */}
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{pattern.icon}</span>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: pattern.color }}
          >
            {pattern.title}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-xl font-semibold text-[var(--text)]">{goalData.title}</h4>
          {goalData.description && (
            <p className="mt-1 text-muted">{goalData.description}</p>
          )}
        </div>

        {/* Category */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-500">Category:</span>
          <span className="flex items-center space-x-1">
            <span>{category?.icon}</span>
            <span className="text-sm text-gray-700">{category?.label}</span>
          </span>
        </div>

        {/* Target */}
        <div>
          <span className="text-sm font-medium text-gray-500">Target:</span>
          <p className="text-gray-700">
            {goalData.target.value} {goalData.target.unit}
            {goalData.target.period && ` per ${goalData.target.period}`}
          </p>
        </div>

        {/* Motivation */}
        {goalData.context?.motivation && (
          <div>
            <span className="text-sm font-medium text-gray-500">Motivation:</span>
            <p className="text-gray-700">{goalData.context.motivation}</p>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Your goal is set to <strong>private</strong> by default. You can change visibility settings later.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={() => window.history.back()}
        >
          Back to Edit
        </Button>
        <Button
          onClick={onSubmit}
          isLoading={isSubmitting}
          loadingText="Creating Goal..."
          size="lg"
        >
          Create Goal
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;

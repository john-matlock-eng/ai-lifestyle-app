import React from 'react';
import { GoalContext } from '../../types/api.types';
import Button from '../../../../components/common/Button';

interface MotivationStepProps {
  initialValues?: GoalContext;
  onComplete: (context?: GoalContext) => void;
}

const MotivationStep: React.FC<MotivationStepProps> = ({ initialValues, onComplete }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement motivation form
    onComplete({
      motivation: 'I want to achieve this goal to improve my life',
      importanceLevel: 4,
      ...initialValues,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Motivation</h3>
        <p className="text-sm text-gray-600">
          Understanding why this goal matters will help you stay committed.
        </p>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-8 text-gray-500">
        Motivation configuration coming soon...
      </div>

      <div className="flex justify-end">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};

export default MotivationStep;

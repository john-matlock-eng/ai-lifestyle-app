import React from 'react';
import { GoalPattern, GoalSchedule } from '../../types/api.types';
import Button from '../../../../components/common/Button';

interface ScheduleStepProps {
  pattern: GoalPattern;
  initialValues?: GoalSchedule;
  onComplete: (schedule?: GoalSchedule) => void;
}

const ScheduleStep: React.FC<ScheduleStepProps> = ({ pattern, initialValues, onComplete }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, skip schedule for non-recurring goals
    if (pattern !== 'recurring') {
      onComplete(undefined);
      return;
    }
    
    // TODO: Implement schedule form
    onComplete({
      frequency: 'daily',
      checkInFrequency: 'daily',
      catchUpAllowed: true,
      ...initialValues,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Your Goal</h3>
        <p className="text-sm text-gray-600">
          When and how often do you want to work on this goal?
        </p>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-8 text-gray-500">
        Schedule configuration coming soon...
      </div>

      <div className="flex justify-end">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};

export default ScheduleStep;

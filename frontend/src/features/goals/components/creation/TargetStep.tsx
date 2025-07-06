import React from 'react';
import type { GoalPattern, GoalTarget } from '../../types/api.types';
import { getDefaultsByPattern } from '../../types/ui.types';
import Button from '../../../../components/common/Button';

interface TargetStepProps {
  pattern: GoalPattern;
  initialValues?: Partial<GoalTarget>;
  onComplete: (target: GoalTarget) => void;
}

const TargetStep: React.FC<TargetStepProps> = ({ pattern, initialValues, onComplete }) => {
  // Placeholder implementation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form validation and submission
    const defaults = getDefaultsByPattern(pattern);
    onComplete({
      metric: 'count',
      value: 10,
      unit: 'times',
      direction: defaults.direction,
      targetType: defaults.targetType,
      period: defaults.period,
      ...initialValues,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Set Your Target</h3>
        <p className="text-sm text-gray-600">
          Define what you want to achieve with this {pattern} goal.
        </p>
      </div>

      {/* Placeholder content - will be implemented based on pattern */}
      <div className="text-center py-8 text-gray-500">
        Target configuration for {pattern} goals coming soon...
      </div>

      <div className="flex justify-end">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};

export default TargetStep;

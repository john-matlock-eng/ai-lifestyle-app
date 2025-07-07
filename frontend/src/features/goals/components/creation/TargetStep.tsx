import React, { useState } from 'react';
import type { GoalPattern, GoalTarget } from '../../types/api.types';
import { getDefaultsByPattern } from '../../types/ui.types';
import Button from '../../../../components/common/Button';
import { Target, Flame, Trophy, Shield, Calendar } from 'lucide-react';
import { METRIC_UNITS, MetricType } from '../../types/goal.types';

interface TargetStepProps {
  pattern: GoalPattern;
  initialValues?: Partial<GoalTarget>;
  onComplete: (target: GoalTarget) => void;
}

const TargetStep: React.FC<TargetStepProps> = ({ pattern, initialValues, onComplete }) => {
  const defaults = getDefaultsByPattern(pattern);
  
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [target, setTarget] = useState<GoalTarget>({
    metric: initialValues?.metric || 'count',
    value: initialValues?.value || defaults.value || 1,
    unit: initialValues?.unit || 'times',
    direction: initialValues?.direction || defaults.direction,
    targetType: initialValues?.targetType || defaults.targetType,
    period: initialValues?.period || defaults.period,
    targetDate: initialValues?.targetDate,
    ...initialValues,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(target);
  };

  const updateTarget = (updates: Partial<GoalTarget>) => {
    setTarget(prev => ({ ...prev, ...updates }));
  };

  const availableUnits = METRIC_UNITS[metricType] || [];

  const getPatternIcon = () => {
    const icons = {
      recurring: Calendar,
      target: Target,
      milestone: Trophy,
      streak: Flame,
      limit: Shield,
    };
    return icons[pattern] || Target;
  };

  const PatternIcon = getPatternIcon();

  const renderPatternSpecificFields = () => {
    switch (pattern) {
      case 'recurring':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target per {target.period || 'day'}
                </label>
                <input
                  type="number"
                  value={target.value}
                  onChange={(e) => updateTarget({ value: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period
                </label>
                <select
                  value={target.period}
                  onChange={(e) => updateTarget({ period: e.target.value as 'day' | 'week' | 'month' | 'quarter' | 'year' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Example: Exercise 3 times per week, Read 20 pages per day
            </p>
          </>
        );

      case 'target':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total target to reach
              </label>
              <input
                type="number"
                value={target.value}
                onChange={(e) => updateTarget({ value: parseInt(e.target.value) || 1 })}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target date (optional)
              </label>
              <input
                type="date"
                value={target.targetDate ? target.targetDate.split('T')[0] : ''}
                onChange={(e) => updateTarget({ targetDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Example: Read 52 books this year, Save $10,000 by December
            </p>
          </>
        );

      case 'streak':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Streak target (consecutive days)
              </label>
              <input
                type="number"
                value={target.value}
                onChange={(e) => updateTarget({ value: parseInt(e.target.value) || 1 })}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Example: Meditate for 30 consecutive days, Write daily for 100 days
            </p>
          </>
        );

      case 'milestone':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What do you want to achieve?
              </label>
              <input
                type="text"
                placeholder="e.g., Complete marathon, Finish online course"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target completion date
              </label>
              <input
                type="date"
                value={target.targetDate ? target.targetDate.split('T')[0] : ''}
                onChange={(e) => updateTarget({ targetDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </>
        );

      case 'limit':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum allowed per {target.period || 'day'}
              </label>
              <input
                type="number"
                value={target.value}
                onChange={(e) => updateTarget({ value: parseInt(e.target.value) || 1 })}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <select
                value={target.period}
                onChange={(e) => updateTarget({ period: e.target.value as 'day' | 'week' | 'month' | 'quarter' | 'year' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Example: Maximum 2 hours social media per day, Spend less than $50 per week on dining out
            </p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <PatternIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Set Your Target</h3>
          <p className="text-sm text-gray-600">
            Define what you want to achieve with this {pattern} goal
          </p>
        </div>
      </div>

      {/* Unit Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What are you measuring?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={metricType}
            onChange={(e) => {
              const newType = e.target.value as MetricType;
              setMetricType(newType);
              updateTarget({ 
                metric: newType === 'count' ? 'count' : newType,
                unit: METRIC_UNITS[newType][0] || 'times' 
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="count">Count</option>
            <option value="duration">Duration</option>
            <option value="amount">Amount</option>
            <option value="distance">Distance</option>
          </select>
          <select
            value={target.unit}
            onChange={(e) => updateTarget({ unit: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {availableUnits.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pattern-specific fields */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        {renderPatternSpecificFields()}
      </div>

      {/* Preview */}
      <div className="bg-primary-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Goal Summary</h4>
        <div className="text-sm text-gray-700">
          {pattern === 'recurring' && (
            <p>Complete {target.value} {target.unit} per {target.period}</p>
          )}
          {pattern === 'target' && (
            <p>Reach {target.value} {target.unit}{target.targetDate && ` by ${new Date(target.targetDate).toLocaleDateString()}`}</p>
          )}
          {pattern === 'streak' && (
            <p>Maintain activity for {target.value} consecutive days</p>
          )}
          {pattern === 'milestone' && (
            <p>Complete milestone{target.targetDate && ` by ${new Date(target.targetDate).toLocaleDateString()}`}</p>
          )}
          {pattern === 'limit' && (
            <p>Stay under {target.value} {target.unit} per {target.period}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};

export default TargetStep;

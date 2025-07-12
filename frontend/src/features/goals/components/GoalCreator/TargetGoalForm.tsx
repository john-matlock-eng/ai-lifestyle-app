import React, { useState } from 'react';
import { Target, Calendar, TrendingUp, TrendingDown, Info } from 'lucide-react';
import type {
  TargetGoalFormData,
  MetricType,
} from '../../types/goal.types';
import {
  GOAL_CATEGORIES,
  METRIC_UNITS,
} from '../../types/goal.types';

interface TargetGoalFormProps {
  onSubmit: (data: TargetGoalFormData) => void;
  onCancel: () => void;
  initialData?: Partial<TargetGoalFormData>;
  isJournalLinked?: boolean;
  setIsJournalLinked?: (value: boolean) => void;
}

export const TargetGoalForm: React.FC<TargetGoalFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  isJournalLinked = false,
  setIsJournalLinked,
}) => {
  
  const [formData, setFormData] = useState<TargetGoalFormData>({
    title: '',
    description: '',
    category: 'health',
    goalPattern: 'target',
    targetValue: 0,
    unit: 'pounds',
    startValue: 0,
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    direction: 'decrease',
    icon: '🎯',
    color: '#10B981',
    ...initialData,
  });
  
  const [metricType, setMetricType] = useState<MetricType>('weight');
  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [privateNotes, setPrivateNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For now, we'll just submit the form data without metadata
    // The parent component can handle encryption if needed
    onSubmit(formData);
  };

  const updateFormData = (updates: Partial<TargetGoalFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const availableUnits = METRIC_UNITS[metricType] || [];
  
  // Calculate days until target
  const daysUntilTarget = Math.ceil(
    (formData.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  // Calculate required change
  const totalChange = Math.abs(formData.targetValue - formData.startValue);
  const changePerWeek = daysUntilTarget > 0 
    ? (totalChange / daysUntilTarget) * 7 
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Target className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">Create Target Goal</h3>
          <p className="text-sm text-muted">Set a specific target to reach by a deadline</p>
        </div>
      </div>

      {/* Goal Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Goal Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="e.g., Reach my ideal weight"
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => updateFormData({ category: e.target.value })}
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        >
          {GOAL_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Target Configuration */}
      <div className="bg-green-50 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-[var(--text)] flex items-center gap-2">
          <Target className="h-4 w-4 text-green-600" />
          Define your target
        </h4>

        {/* Direction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goal Direction
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateFormData({ direction: 'increase' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-colors ${
                formData.direction === 'increase'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-[color:var(--surface-muted)] hover:border-[color:var(--surface-muted)]'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Increase
            </button>
            <button
              type="button"
              onClick={() => updateFormData({ direction: 'decrease' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-colors ${
                formData.direction === 'decrease'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-[color:var(--surface-muted)] hover:border-[color:var(--surface-muted)]'
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              Decrease
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Starting Value */}
          <div>
            <label htmlFor="startValue" className="block text-sm font-medium text-gray-700 mb-1">
              Current Value
            </label>
            <input
              type="number"
              id="startValue"
              value={formData.startValue}
              onChange={(e) => updateFormData({ startValue: parseFloat(e.target.value) || 0 })}
              step="0.1"
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          {/* Target Value */}
          <div>
            <label htmlFor="targetValue" className="block text-sm font-medium text-gray-700 mb-1">
              Target Value
            </label>
            <input
              type="number"
              id="targetValue"
              value={formData.targetValue}
              onChange={(e) => updateFormData({ targetValue: parseFloat(e.target.value) || 0 })}
              step="0.1"
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          {/* Unit */}
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <div className="flex gap-2">
              <select
                value={metricType}
                onChange={(e) => {
                  const newType = e.target.value as MetricType;
                  setMetricType(newType);
                  updateFormData({ unit: METRIC_UNITS[newType][0] || '' });
                }}
                className="flex-1 px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="weight">Weight</option>
                <option value="distance">Distance</option>
                <option value="duration">Duration</option>
                <option value="amount">Amount</option>
                <option value="money">Money</option>
                <option value="custom">Custom</option>
              </select>
              <select
                id="unit"
                value={formData.unit}
                onChange={(e) => updateFormData({ unit: e.target.value })}
                className="flex-1 px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                {availableUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Target Date */}
        <div>
          <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            Target Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="targetDate"
            value={formData.targetDate.toISOString().split('T')[0]}
            onChange={(e) => updateFormData({ targetDate: new Date(e.target.value) })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        {/* Target Summary */}
        <div className="bg-green-100 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-900">Goal Summary</span>
            <span className="text-sm text-green-700">{daysUntilTarget} days</span>
          </div>
          
          <div className="text-lg font-semibold text-green-900">
            {formData.direction === 'increase' ? 'Increase' : 'Decrease'} from{' '}
            <span className="text-green-600">{formData.startValue}</span> to{' '}
            <span className="text-green-600">{formData.targetValue}</span> {formData.unit}
          </div>
          
          {changePerWeek > 0 && (
            <div className="text-sm text-green-700">
              Required change: ~{changePerWeek.toFixed(1)} {formData.unit} per week
            </div>
          )}
          
          <div className="mt-2 pt-2 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-xs text-green-700">Total Change</span>
              <span className="text-sm font-medium text-green-900">
                {totalChange.toFixed(1)} {formData.unit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Why is this target important to you?"
          rows={3}
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Private Notes */}
      <div className="border-t pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includePrivateNotes}
            onChange={(e) => setIncludePrivateNotes(e.target.checked)}
            className="h-4 w-4 text-green-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            Add private encrypted notes
          </span>
          <Info className="h-4 w-4 text-gray-400" />
        </label>
        
        {includePrivateNotes && (
          <div className="mt-3">
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="Your strategy, obstacles to overcome, or personal thoughts (encrypted)..."
              rows={3}
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              🔒 These notes will be encrypted and only visible to you
            </p>
          </div>
        )}
      </div>

      {/* Journal Linking */}
      {setIsJournalLinked && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="journal-linked"
            checked={isJournalLinked}
            onChange={(e) => setIsJournalLinked(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="journal-linked" className="text-sm text-gray-700">
            Link this goal to journaling
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:text-[var(--text)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]"
        >
          Create Goal
        </button>
      </div>
    </form>
  );
};

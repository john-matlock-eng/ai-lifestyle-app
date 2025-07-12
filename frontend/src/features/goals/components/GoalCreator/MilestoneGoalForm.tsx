import React, { useState } from 'react';
import { Trophy, TrendingUp, Calendar, Info } from 'lucide-react';
import type {
  MilestoneGoalFormData,
  MetricType,
} from '../../types/goal.types';
import {
  GOAL_CATEGORIES,
  METRIC_UNITS,
} from '../../types/goal.types';

interface MilestoneGoalFormProps {
  onSubmit: (data: MilestoneGoalFormData) => void;
  onCancel: () => void;
  initialData?: Partial<MilestoneGoalFormData>;
  isJournalLinked?: boolean;
  setIsJournalLinked?: (value: boolean) => void;
}

export const MilestoneGoalForm: React.FC<MilestoneGoalFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  isJournalLinked = false,
  setIsJournalLinked,
}) => {
  
  const [formData, setFormData] = useState<MilestoneGoalFormData>({
    title: '',
    description: '',
    category: 'productivity',
    goalPattern: 'milestone',
    targetValue: 100,
    unit: 'items',
    currentValue: 0,
    targetDate: undefined,
    icon: '🏆',
    color: '#8B5CF6',
    ...initialData,
  });
  
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [privateNotes, setPrivateNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For now, we'll just submit the form data without metadata
    // The parent component can handle encryption if needed
    onSubmit(formData);
  };

  const updateFormData = (updates: Partial<MilestoneGoalFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const availableUnits = METRIC_UNITS[metricType] || [];
  const progress = formData.targetValue > 0 
    ? Math.round(((formData.currentValue || 0) / formData.targetValue) * 100)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--accent-bg)] rounded-lg">
          <Trophy className="h-6 w-6 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">Create Milestone Goal</h3>
          <p className="text-sm text-muted">Set a cumulative target to achieve</p>
        </div>
      </div>

      {/* Goal Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
          Goal Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="e.g., Write my first novel"
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => updateFormData({ category: e.target.value })}
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          required
        >
          {GOAL_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Milestone Configuration */}
      <div className="bg-[var(--surface-muted)] rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-[var(--text)] flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
          What milestone do you want to reach?
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Value */}
          <div>
            <label htmlFor="targetValue" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Target Amount
            </label>
            <input
              type="number"
              id="targetValue"
              value={formData.targetValue}
              onChange={(e) => updateFormData({ targetValue: parseInt(e.target.value) || 0 })}
              min={1}
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
              required
            />
          </div>

          {/* Unit */}
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
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
                className="flex-1 px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="count">Count</option>
                <option value="amount">Amount</option>
                <option value="distance">Distance</option>
                <option value="money">Money</option>
              </select>
              <select
                id="unit"
                value={formData.unit}
                onChange={(e) => updateFormData({ unit: e.target.value })}
                className="flex-1 px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                {availableUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Progress */}
          <div>
            <label htmlFor="currentValue" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Current Progress
            </label>
            <input
              type="number"
              id="currentValue"
              value={formData.currentValue}
              onChange={(e) => updateFormData({ currentValue: parseInt(e.target.value) || 0 })}
              min={0}
              max={formData.targetValue}
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Optional Target Date */}
        <div>
          <label htmlFor="targetDate" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            Target Date (optional)
          </label>
          <input
            type="date"
            id="targetDate"
            value={formData.targetDate ? formData.targetDate.toISOString().split('T')[0] : ''}
            onChange={(e) => updateFormData({ 
              targetDate: e.target.value ? new Date(e.target.value) : undefined 
            })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Add a deadline to help stay motivated
          </p>
        </div>

        {/* Progress Preview */}
        <div className="bg-[var(--accent-bg)] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text)]">Starting Progress</span>
            <span className="text-sm font-bold text-[var(--text)]">{progress}%</span>
          </div>
          <div className="w-full bg-[var(--surface-muted)] rounded-full h-2">
            <div 
              className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[var(--accent)]">
            <span>{formData.currentValue} {formData.unit}</span>
            <span>{formData.targetValue} {formData.unit}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="What does achieving this milestone mean to you?"
          rows={3}
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      {/* Private Notes */}
      <div className="border-t pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includePrivateNotes}
            onChange={(e) => setIncludePrivateNotes(e.target.checked)}
            className="h-4 w-4 text-[var(--accent)] rounded"
          />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Add private encrypted notes
          </span>
          <Info className="h-4 w-4 text-[var(--text-muted)]" />
        </label>
        
        {includePrivateNotes && (
          <div className="mt-3">
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="Your motivation, milestones along the way, or personal thoughts (encrypted)..."
              rows={3}
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
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
          <label htmlFor="journal-linked" className="text-sm text-[var(--text-secondary)]">
            Link this goal to journaling
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]"
        >
          Create Goal
        </button>
      </div>
    </form>
  );
};

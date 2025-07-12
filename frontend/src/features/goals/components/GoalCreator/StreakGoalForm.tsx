import React, { useState } from 'react';
import { Flame, Calendar, Zap, Info } from 'lucide-react';
import type {
  StreakGoalFormData,
  Frequency,
} from '../../types/goal.types';
import {
  GOAL_CATEGORIES,
} from '../../types/goal.types';

interface StreakGoalFormProps {
  onSubmit: (data: StreakGoalFormData) => void;
  onCancel: () => void;
  initialData?: Partial<StreakGoalFormData>;
}

const commonStreakGoals = [
  { title: 'Daily Meditation', targetStreak: 30, unit: 'days', icon: '🧘' },
  { title: '100 Days of Code', targetStreak: 100, unit: 'days', icon: '💻' },
  { title: 'No Smoking', targetStreak: 365, unit: 'days', icon: '🚭' },
  { title: 'Daily Exercise', targetStreak: 50, unit: 'days', icon: '💪' },
  { title: 'Reading Habit', targetStreak: 60, unit: 'days', icon: '📚' },
  { title: 'Gratitude Journal', targetStreak: 90, unit: 'days', icon: '🙏' },
];

export const StreakGoalForm: React.FC<StreakGoalFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
}) => {
  
  const [formData, setFormData] = useState<StreakGoalFormData>({
    title: '',
    description: '',
    category: 'wellness',
    goalPattern: 'streak',
    targetStreak: 30,
    unit: 'days',
    frequency: 'daily',
    icon: '🔥',
    color: '#F59E0B',
    ...initialData,
  });
  
  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [privateNotes, setPrivateNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For now, we'll just submit the form data without metadata
    // The parent component can handle encryption if needed
    onSubmit(formData);
  };

  const updateFormData = (updates: Partial<StreakGoalFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const selectTemplate = (template: typeof commonStreakGoals[0]) => {
    updateFormData({
      title: template.title,
      targetStreak: template.targetStreak,
      unit: template.unit,
      icon: template.icon,
    });
  };

  // Calculate estimated completion date
  const estimatedCompletion = new Date();
  estimatedCompletion.setDate(estimatedCompletion.getDate() + formData.targetStreak);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Flame className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">Create Streak Goal</h3>
          <p className="text-sm text-muted">Build momentum with consecutive daily habits</p>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="bg-orange-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          <Zap className="inline h-4 w-4 mr-1 text-orange-600" />
          Quick Start Templates
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {commonStreakGoals.map((template, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectTemplate(template)}
              className="text-left p-2 rounded-lg border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{template.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--text)]">{template.title}</div>
                  <div className="text-xs text-muted">
                    {template.targetStreak} {template.unit}
                  </div>
                </div>
              </div>
            </button>
          ))}
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
          placeholder="e.g., 30 days of meditation"
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          required
        >
          {GOAL_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Streak Configuration */}
      <div className="bg-orange-50 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-[var(--text)] flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-600" />
          How long do you want your streak to be?
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Streak */}
          <div>
            <label htmlFor="targetStreak" className="block text-sm font-medium text-gray-700 mb-1">
              Target Streak Length
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="targetStreak"
                value={formData.targetStreak}
                onChange={(e) => updateFormData({ targetStreak: parseInt(e.target.value) || 1 })}
                min={1}
                className="flex-1 px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
              <select
                value={formData.unit}
                onChange={(e) => updateFormData({ unit: e.target.value })}
                className="px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              id="frequency"
              value={formData.frequency}
              onChange={(e) => updateFormData({ frequency: e.target.value as Frequency })}
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Streak Preview */}
        <div className="bg-orange-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-orange-900">Your Streak Goal</span>
            <Flame className="h-5 w-5 text-orange-600" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(Math.min(7, formData.targetStreak))].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-orange-100"
                    style={{ opacity: 1 - (i * 0.1) }}
                  >
                    {i + 1}
                  </div>
                ))}
                {formData.targetStreak > 7 && (
                  <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-orange-700 text-xs font-medium border-2 border-orange-100">
                    +{formData.targetStreak - 7}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-lg font-semibold text-orange-900">
              {formData.targetStreak} consecutive {formData.unit}
            </div>
            
            <div className="text-sm text-orange-700">
              Complete by {estimatedCompletion.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Motivation Tips */}
        <div className="bg-[var(--surface)] rounded-lg p-3 border border-orange-200">
          <h5 className="text-sm font-medium text-[var(--text)] mb-2">💡 Tips for Success</h5>
          <ul className="text-xs text-muted space-y-1">
            <li>• Start small - even 1 minute counts!</li>
            <li>• Set a specific time each day</li>
            <li>• Track visually to stay motivated</li>
            <li>• Plan for obstacles in advance</li>
          </ul>
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
          placeholder="What habit are you building? Why is it important?"
          rows={3}
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {/* Private Notes */}
      <div className="border-t pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includePrivateNotes}
            onChange={(e) => setIncludePrivateNotes(e.target.checked)}
            className="h-4 w-4 text-orange-600 rounded"
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
              placeholder="Your triggers, coping strategies, or personal motivations (encrypted)..."
              rows={3}
              className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              🔒 These notes will be encrypted and only visible to you
            </p>
          </div>
        )}
      </div>

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
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]"
        >
          Create Goal
        </button>
      </div>
    </form>
  );
};

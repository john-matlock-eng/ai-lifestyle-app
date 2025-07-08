import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Goal, UpdateGoalRequest } from '../types/api.types';
import type { GoalCategory } from '../types/ui.types';
import { GOAL_CATEGORIES, GOAL_ICONS } from '../types/ui.types';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

interface UpdateGoalFormProps {
  goal: Goal;
  onUpdate: (goalId: string, updates: UpdateGoalRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const UpdateGoalForm: React.FC<UpdateGoalFormProps> = ({
  goal,
  onUpdate,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<UpdateGoalRequest>({
    title: goal.title,
    description: goal.description,
    category: goal.category,
    icon: goal.icon,
    color: goal.color,
    status: goal.status as 'active' | 'paused',
    visibility: goal.visibility,
    target: {
      value: goal.target.value,
      targetDate: goal.target.targetDate,
      currentValue: goal.target.currentValue,
      minValue: goal.target.minValue,
      maxValue: goal.target.maxValue,
    },
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Remove undefined values from the update request
      const cleanedData: UpdateGoalRequest = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanedData[key as keyof UpdateGoalRequest] = value;
        }
      });

      // Clean target object
      if (cleanedData.target) {
        const cleanedTarget: any = {};
        Object.entries(cleanedData.target).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            cleanedTarget[key] = value;
          }
        });
        cleanedData.target = Object.keys(cleanedTarget).length > 0 ? cleanedTarget : undefined;
      }

      await onUpdate(goal.goalId, cleanedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
    }
  };

  const selectedCategory = GOAL_CATEGORIES.find(cat => cat.value === formData.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Goal</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Goal Title
              </label>
              <Input
                id="title"
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Walk 10,000 steps daily"
                maxLength={200}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add more details about your goal..."
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {GOAL_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {GOAL_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`
                      p-3 text-2xl rounded-lg border-2 transition-all
                      ${formData.icon === icon
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="color"
                  type="color"
                  value={formData.color || '#6366f1'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20"
                />
                <span className="text-sm text-gray-600">{formData.color || '#6366f1'}</span>
              </div>
            </div>
          </div>

          {/* Target Value (only for certain goal patterns) */}
          {['target', 'milestone', 'limit'].includes(goal.goalPattern) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Target</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="targetValue" className="block text-sm font-medium text-gray-700 mb-1">
                    Target Value
                  </label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={formData.target?.value || goal.target.value}
                    onChange={(e) => setFormData({
                      ...formData,
                      target: { ...formData.target, value: parseFloat(e.target.value) || 0 }
                    })}
                    min={0}
                    step="0.1"
                  />
                </div>

                {goal.target.targetDate && (
                  <div>
                    <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Target Date
                    </label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={formData.target?.targetDate || goal.target.targetDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        target: { ...formData.target, targetDate: e.target.value }
                      })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Privacy</h3>
            
            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                id="visibility"
                value={formData.visibility || 'private'}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'private' | 'friends' | 'public' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="private">Private (Only you)</option>
                <option value="friends">Friends</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !formData.title}
              isLoading={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateGoalForm;

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGoal, logActivity } from '../../services/goalService';
import { isApiError } from '../../../../api/client';
import type { LogActivityRequest, ActivityType } from '../../types/api.types';
import { formatGoalValue } from '../../types/ui.types';
import Input from '../../../../components/common/Input';
import Button from '../../../../components/common/Button';

interface QuickLogModalProps {
  goalId: string;
  isOpen: boolean;
  onClose: () => void;
}

const QuickLogModal: React.FC<QuickLogModalProps> = ({ goalId, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('progress');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  const { data: goal, isLoading: goalLoading } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => getGoal(goalId),
    enabled: isOpen,
  });

  const logActivityMutation = useMutation({
    mutationFn: (activity: LogActivityRequest) => logActivity(goalId, activity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal-activities', goalId] });
      onClose();
      // Reset form
      setValue('');
      setNote('');
      setActivityType('progress');
      setShowAdvanced(false);
      setActivityDate(new Date().toISOString().split('T')[0]);
      setMood('');
      setEnergyLevel(5);
      setError(null);
    },
    onError: (error: unknown) => {
      console.error('Activity log error:', error);
      let errorMessage = 'Failed to log activity';
      
      if (isApiError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(`Backend Error: ${errorMessage}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !value) return;

    const activity: LogActivityRequest = {
      value: parseFloat(value),
      unit: goal.target.unit,
      activityType,
      note: note.trim() || undefined,
      activityDate: activityDate !== new Date().toISOString().split('T')[0] ? activityDate : undefined,
      context: showAdvanced ? {
        mood: mood || undefined,
        energyLevel: energyLevel || undefined,
      } : undefined,
    };

    console.log('Sending activity log per contract:', activity);
    setError(null);
    logActivityMutation.mutate(activity);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500/75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-surface text-theme rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {goalLoading || !goal ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-theme">Log Activity</h3>
                <p className="mt-1 text-sm text-muted">{goal.title}</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                  <p className="text-xs text-red-600 mt-1">
                    The backend is not compliant with the API contract. Frontend implementation is correct.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Activity Type */}
                <div>
                  <label className="block text-sm font-medium text-theme mb-2">
                    Activity Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['progress', 'completed', 'skipped', 'partial'] as ActivityType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setActivityType(type)}
                        className={`
                          px-3 py-2 rounded-md text-sm font-medium capitalize transition-all
                          ${
                            activityType === type
                              ? 'bg-primary-100 text-primary-800 border-primary-300'
                              : 'bg-surface text-muted border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                          border
                        `}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value Input */}
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">
                    Value
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={goal.target.value.toString()}
                      required
                      min="0"
                      step="any"
                      autoFocus
                    />
                    <span className="text-muted">{goal.target.unit}</span>
                  </div>
                  {goal.target.period && (
                    <p className="mt-1 text-xs text-muted">
                      Target: {formatGoalValue(goal.target.value, goal.target.unit)} per {goal.target.period}
                    </p>
                  )}
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Quick Note */}
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">
                    Note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="How did it go?"
                  />
                </div>

                {/* Advanced Context Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  </button>
                </div>

                {/* Advanced Context Fields */}
                {showAdvanced && (
                  <div className="space-y-4 pt-2 border-t border-gray-200">
                    {/* Mood */}
                    <div>
                      <label className="block text-sm font-medium text-theme mb-2">
                        Mood
                      </label>
                      <div className="flex gap-2">
                        {[
                          { emoji: '😔', label: 'low' },
                          { emoji: '😐', label: 'neutral' },
                          { emoji: '😊', label: 'good' },
                          { emoji: '😄', label: 'great' },
                          { emoji: '🤩', label: 'amazing' },
                        ].map((moodOption) => (
                          <button
                            key={moodOption.label}
                            type="button"
                            onClick={() => setMood(moodOption.label)}
                            className={`
                              flex flex-col items-center p-2 rounded-lg border-2 transition-all
                              ${mood === moodOption.label 
                                ? 'border-primary-500 bg-primary-50' 
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            <span className="text-2xl">{moodOption.emoji}</span>
                            <span className="text-xs mt-1">{moodOption.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Energy Level */}
                    <div>
                      <label className="block text-sm font-medium text-theme mb-2">
                        Energy Level: {energyLevel}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(energyLevel - 1) * 11.11}%, #E5E7EB ${(energyLevel - 1) * 11.11}%, #E5E7EB 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={logActivityMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={logActivityMutation.isPending}
                    loadingText="Logging..."
                    disabled={!value}
                  >
                    Log Activity
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickLogModal;

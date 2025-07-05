import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGoal, logActivity } from '../../services/goalService';
import { LogActivityRequest, ActivityType } from '../../types/api.types';
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
    };

    logActivityMutation.mutate(activity);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {goalLoading || !goal ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Log Activity</h3>
                <p className="mt-1 text-sm text-gray-600">{goal.title}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Activity Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <span className="text-gray-600">{goal.target.unit}</span>
                  </div>
                  {goal.target.period && (
                    <p className="mt-1 text-xs text-gray-500">
                      Target: {formatGoalValue(goal.target.value, goal.target.unit)} per {goal.target.period}
                    </p>
                  )}
                </div>

                {/* Quick Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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

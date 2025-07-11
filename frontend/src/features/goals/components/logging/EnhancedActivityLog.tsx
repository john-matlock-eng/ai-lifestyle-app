import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
Battery, Clock, MapPin,
Sun
} from 'lucide-react';
import { getGoal, logActivity } from '../../services/goalService';
import type { 
  LogActivityRequest, 
  ActivityType, 
  TimeOfDay,
  ActivityLocation,
  ActivityContext 
} from '../../types/api.types';
import { formatGoalValue } from '../../types/ui.types';
import Input from '../../../../components/common/Input';
import Button from '../../../../components/common/Button';

interface EnhancedActivityLogProps {
  goalId: string;
  isOpen: boolean;
  onClose: () => void;
}

const timeOfDayOptions: { value: TimeOfDay; label: string; icon: typeof Sun }[] = [
  { value: 'early-morning', label: 'Early Morning', icon: Sun },
  { value: 'morning', label: 'Morning', icon: Sun },
  { value: 'afternoon', label: 'Afternoon', icon: Sun },
  { value: 'evening', label: 'Evening', icon: Sun },
  { value: 'night', label: 'Night', icon: Sun },
];

const locationOptions: { value: ActivityLocation['type']; label: string; icon: typeof MapPin }[] = [
  { value: 'home', label: 'Home', icon: MapPin },
  { value: 'work', label: 'Work', icon: MapPin },
  { value: 'gym', label: 'Gym', icon: MapPin },
  { value: 'outdoors', label: 'Outdoors', icon: MapPin },
  { value: 'travel', label: 'Travel', icon: MapPin },
];

const moodOptions = [
  { value: 'excited', emoji: '😊', label: 'Excited' },
  { value: 'happy', emoji: '😄', label: 'Happy' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'stressed', emoji: '😰', label: 'Stressed' },
];

const EnhancedActivityLog: React.FC<EnhancedActivityLogProps> = ({ goalId, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed'>('quick');
  
  // Basic fields
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('progress');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Context fields
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | undefined>();
  const [location, setLocation] = useState<ActivityLocation['type'] | undefined>();
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [duration, setDuration] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [enjoyment, setEnjoyment] = useState<number>(3);
  const [mood, setMood] = useState<string>('');

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
      resetForm();
    },
  });

  const resetForm = () => {
    setValue('');
    setNote('');
    setActivityType('progress');
    setActivityDate(new Date().toISOString().split('T')[0]);
    setTimeOfDay(undefined);
    setLocation(undefined);
    setEnergyLevel(5);
    setDuration('');
    setDifficulty(3);
    setEnjoyment(3);
    setMood('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !value) return;

    const context: ActivityContext = {};
    
    if (timeOfDay) context.timeOfDay = timeOfDay;
    if (energyLevel !== 5) context.energyLevel = energyLevel;
    if (duration) context.duration = parseInt(duration);
    if (difficulty !== 3) context.difficulty = difficulty;
    if (enjoyment !== 3) context.enjoyment = enjoyment;
    if (mood) context.mood = mood;

    const activity: LogActivityRequest = {
      value: parseFloat(value),
      unit: goal.target.unit,
      activityType,
      activityDate: activityDate !== new Date().toISOString().split('T')[0] ? activityDate : undefined,
      note: note.trim() || undefined,
      location: location ? { type: location } : undefined,
      context: Object.keys(context).length > 0 ? context : undefined,
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

        <div className="inline-block align-bottom bg-[var(--surface)] rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {goalLoading || !goal ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-[var(--text)]">Log Activity</h3>
                <p className="mt-1 text-sm text-muted">{goal.title}</p>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'quick'
                      ? 'text-primary-600 border-primary-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Quick Log
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('detailed')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'detailed'
                      ? 'text-primary-600 border-primary-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Detailed Log
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Fields (Always Shown) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                : 'bg-[var(--surface)] text-gray-700 border-gray-300 hover:bg-gray-50'
                            }
                            border
                          `}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
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
                    <span className="text-muted">{goal.target.unit}</span>
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

                {/* Detailed Context (Only in Detailed Tab) */}
                {activeTab === 'detailed' && (
                  <>
                    {/* Time & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Time of Day */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="inline h-4 w-4 mr-1" />
                          Time of Day
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {timeOfDayOptions.slice(0, 3).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setTimeOfDay(option.value)}
                              className={`
                                px-2 py-1 rounded text-xs font-medium transition-all
                                ${
                                  timeOfDay === option.value
                                    ? 'bg-primary-100 text-primary-800 border-primary-300'
                                    : 'bg-[var(--surface)] text-muted border-gray-300 hover:bg-gray-50'
                                }
                                border
                              `}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {timeOfDayOptions.slice(3).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setTimeOfDay(option.value)}
                              className={`
                                px-2 py-1 rounded text-xs font-medium transition-all
                                ${
                                  timeOfDay === option.value
                                    ? 'bg-primary-100 text-primary-800 border-primary-300'
                                    : 'bg-[var(--surface)] text-muted border-gray-300 hover:bg-gray-50'
                                }
                                border
                              `}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="inline h-4 w-4 mr-1" />
                          Location
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {locationOptions.slice(0, 3).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setLocation(option.value)}
                              className={`
                                px-2 py-1 rounded text-xs font-medium transition-all
                                ${
                                  location === option.value
                                    ? 'bg-primary-100 text-primary-800 border-primary-300'
                                    : 'bg-[var(--surface)] text-muted border-gray-300 hover:bg-gray-50'
                                }
                                border
                              `}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {locationOptions.slice(3).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setLocation(option.value)}
                              className={`
                                px-2 py-1 rounded text-xs font-medium transition-all
                                ${
                                  location === option.value
                                    ? 'bg-primary-100 text-primary-800 border-primary-300'
                                    : 'bg-[var(--surface)] text-muted border-gray-300 hover:bg-gray-50'
                                }
                                border
                              `}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Energy & Mood */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Energy Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Battery className="inline h-4 w-4 mr-1" />
                          Energy Level: {energyLevel}/10
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={energyLevel}
                          onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>

                      {/* Mood */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mood
                        </label>
                        <div className="flex gap-2">
                          {moodOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setMood(option.value)}
                              className={`
                                px-3 py-2 rounded-md text-xl transition-all
                                ${
                                  mood === option.value
                                    ? 'bg-primary-100 ring-2 ring-primary-300'
                                    : 'bg-gray-50 hover:bg-gray-100'
                                }
                              `}
                              title={option.label}
                            >
                              {option.emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Activity Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (minutes)
                        </label>
                        <Input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          min="0"
                          placeholder="30"
                        />
                      </div>

                      {/* Difficulty */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Difficulty: {difficulty}/5
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={difficulty}
                          onChange={(e) => setDifficulty(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Enjoyment */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Enjoyment: {enjoyment}/5
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={enjoyment}
                          onChange={(e) => setEnjoyment(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-gray-500">
                    {activeTab === 'quick' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('detailed')}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Add more context →
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-3">
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
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedActivityLog;

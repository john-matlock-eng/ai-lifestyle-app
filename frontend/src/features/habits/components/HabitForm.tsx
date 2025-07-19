import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { 
  CreateHabitRequest, 
  UpdateHabitRequest, 
  Habit,
  HabitCategory 
} from '@/types/habits';
import { HABIT_CATEGORIES } from '@/types/habits';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { 
  Save, 
  X, 
  Target, 
  Clock,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';

// Validation schema
const habitFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  category: z.enum(['health', 'fitness', 'productivity', 'mindfulness', 'learning', 'social', 'creative', 'financial', 'other'] as const),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  pattern: z.enum(['daily', 'weekly', 'custom']),
  targetDays: z.number().min(1).max(365),
  motivationalText: z.string().max(200, 'Motivational text is too long').optional(),
  reminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional().or(z.literal('')),
  goalId: z.string().optional(),
  showOnDashboard: z.boolean()
});

type HabitFormData = z.infer<typeof habitFormSchema>;

interface HabitFormProps {
  habit?: Habit;
  onSubmit: (data: CreateHabitRequest | UpdateHabitRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Popular emoji icons for habits
const EMOJI_ICONS = [
  '💪', '🏃', '🧘', '📚', '💊', '💧', '🥗', '🎯',
  '✍️', '🎨', '🎵', '💰', '🌱', '🧠', '😴', '🚭',
  '📱', '🏋️', '🚴', '🏊', '⛰️', '🧘‍♀️', '🧘‍♂️', '📖',
  '✅', '⭐', '🔥', '💎', '🌟', '🌈', '🎉', '🏆'
];

// Preset colors
const PRESET_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // purple
  '#A855F7', // violet
  '#EC4899', // pink
];

export const HabitForm: React.FC<HabitFormProps> = ({ 
  habit, 
  onSubmit, 
  onCancel,
  isSubmitting = false 
}) => {
  // const navigate = useNavigate(); // TODO: Use for navigation
  const [selectedIcon, setSelectedIcon] = useState(habit?.icon || '🎯');
  const [selectedColor, setSelectedColor] = useState(habit?.color || '#3B82F6');
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const isEditing = !!habit;
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: habit?.title || '',
      description: habit?.description || '',
      category: habit?.category as HabitCategory || 'other',
      icon: habit?.icon || '🎯',
      color: habit?.color || '#3B82F6',
      pattern: habit?.pattern || 'daily',
      targetDays: habit?.targetDays || 30,
      motivationalText: habit?.motivationalText || '',
      reminderTime: habit?.reminderTime || '',
      goalId: habit?.goalId || '',
      showOnDashboard: habit?.showOnDashboard ?? true
    }
  });

  // const selectedCategory = watch('category'); // TODO: Use for conditional rendering
  const pattern = watch('pattern');

  const onFormSubmit = async (data: HabitFormData) => {
    try {
      // Clean up optional fields
      const submitData = {
        ...data,
        reminderTime: data.reminderTime || undefined,
        motivationalText: data.motivationalText || undefined,
        description: data.description || undefined,
        goalId: data.goalId || undefined,
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Habit' : 'Create New Habit'}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Icon and Color Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: `${selectedColor}20` }}
              >
                {selectedIcon}
              </button>
              <span className="text-sm text-gray-500">Click to change</span>
            </div>
            
            {showIconPicker && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg grid grid-cols-8 gap-2">
                {EMOJI_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setSelectedIcon(emoji);
                      setValue('icon', emoji);
                      setShowIconPicker(false);
                    }}
                    className={`w-10 h-10 rounded flex items-center justify-center text-xl hover:bg-gray-200 transition-colors ${
                      selectedIcon === emoji ? 'bg-gray-200 ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            <input type="hidden" {...register('icon')} value={selectedIcon} />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-gray-300"
                  style={{ backgroundColor: selectedColor }}
                />
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="color"
                      value={selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        field.onChange(e.target.value);
                      }}
                      className="sr-only"
                      id="color-picker"
                    />
                  )}
                />
                <label 
                  htmlFor="color-picker"
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Custom
                </label>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      setValue('color', color);
                    }}
                    className={`w-8 h-8 rounded-full ring-2 ring-offset-2 transition-all ${
                      selectedColor === color ? 'ring-gray-400' : 'ring-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            {errors.color && (
              <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Habit Title *
            </label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Morning Meditation"
              error={errors.title?.message}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Add more details about this habit..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              {...register('category')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {HABIT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pattern *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['daily', 'weekly', 'custom'] as const).map((p) => (
                <label
                  key={p}
                  className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                    pattern === p
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    {...register('pattern')}
                    value={p}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="targetDays" className="block text-sm font-medium text-gray-700 mb-1">
              Target Days <Target className="inline w-4 h-4 text-gray-400 ml-1" />
            </label>
            <Controller
              name="targetDays"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="targetDays"
                  type="number"
                  min="1"
                  max="365"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 1)}
                  error={errors.targetDays?.message}
                />
              )}
            />
            <p className="mt-1 text-sm text-gray-500">
              How many days until you consider this habit established?
            </p>
          </div>
        </div>
      </div>

      {/* Motivation & Reminders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Motivation & Reminders</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="motivationalText" className="block text-sm font-medium text-gray-700 mb-1">
              Motivational Text <Sparkles className="inline w-4 h-4 text-gray-400 ml-1" />
            </label>
            <Input
              id="motivationalText"
              {...register('motivationalText')}
              placeholder="e.g., A calm mind is a powerful mind"
              error={errors.motivationalText?.message}
            />
            <p className="mt-1 text-sm text-gray-500">
              This will appear when you haven't completed the habit yet
            </p>
          </div>

          <div>
            <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 mb-1">
              Reminder Time <Clock className="inline w-4 h-4 text-gray-400 ml-1" />
            </label>
            <Input
              id="reminderTime"
              {...register('reminderTime')}
              type="time"
              error={errors.reminderTime?.message}
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional daily reminder (24-hour format)
            </p>
          </div>

          <div>
            <label htmlFor="goalId" className="block text-sm font-medium text-gray-700 mb-1">
              Link to Goal <LinkIcon className="inline w-4 h-4 text-gray-400 ml-1" />
            </label>
            <select
              id="goalId"
              {...register('goalId')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">No linked goal</option>
              {/* TODO: Fetch and display user's goals */}
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="showOnDashboard"
              type="checkbox"
              {...register('showOnDashboard')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showOnDashboard" className="ml-2 block text-sm text-gray-700">
              Show on dashboard
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          <Save className="w-4 h-4 mr-2" />
          {isEditing ? 'Update Habit' : 'Create Habit'}
        </Button>
      </div>
    </form>
  );
};

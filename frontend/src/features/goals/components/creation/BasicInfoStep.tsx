import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../../../../components/common/Input';
import Button from '../../../../components/common/Button';
import { GOAL_CATEGORIES } from '../../types/ui.types';

const basicInfoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  category: z.string().min(1, 'Category is required'),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

interface BasicInfoStepProps {
  initialValues: BasicInfoFormData;
  onComplete: (data: BasicInfoFormData) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ initialValues, onComplete }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: initialValues,
  });

  const selectedCategory = watch('category');
  const selectedColor = watch('color') || '#3B82F6';

  const onSubmit = (data: BasicInfoFormData) => {
    onComplete(data);
  };

  const colorOptions = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#10B981', // green
    '#F59E0B', // orange
    '#EF4444', // red
    '#EC4899', // pink
    '#14B8A6', // teal
    '#6366F1', // indigo
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[var(--text)] mb-4">Basic Information</h3>
        <p className="text-sm text-muted mb-6">
          Give your goal a clear name and choose a category to help organize it.
        </p>
      </div>

      {/* Title */}
      <Input
        label="Goal Title"
        placeholder="e.g., Run 5K every morning"
        isRequired
        {...register('title')}
        error={errors.title?.message}
        autoFocus
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-[color:var(--surface-muted)] rounded-md focus:ring-primary-500 focus:border-primary-500"
          placeholder="Add more details about your goal..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GOAL_CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => {
                setValue('category', category.value);
                // Set icon based on category
                setValue('icon', category.icon);
              }}
              className={`
                p-3 rounded-lg border-2 transition-all text-center
                ${
                  selectedCategory === category.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-[color:var(--surface-muted)] hover:border-[color:var(--surface-muted)]'
                }
              `}
            >
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-sm font-medium">{category.label}</div>
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Theme (optional)
        </label>
        <div className="flex items-center space-x-3">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`
                w-10 h-10 rounded-full border-2 transition-all
                ${selectedColor === color ? 'border-gray-900 scale-110' : 'border-[color:var(--surface-muted)]'}
              `}
              style={{ backgroundColor: color }}
              aria-label={`Select ${color} color`}
            />
          ))}
        </div>
        <input type="hidden" {...register('color')} />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Continue
        </Button>
      </div>
    </form>
  );
};

export default BasicInfoStep;

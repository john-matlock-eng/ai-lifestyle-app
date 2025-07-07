import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { GoalPattern, CreateGoalRequest } from '../../types/api.types';
import type { 
  RecurringGoalFormData,
  TargetGoalFormData,
  MilestoneGoalFormData,
  StreakGoalFormData,
  LimitGoalFormData
} from '../../types/goal.types';
import PatternSelector from './PatternSelector';
import { RecurringGoalForm } from '../GoalCreator/RecurringGoalForm';
import { TargetGoalForm } from '../GoalCreator/TargetGoalForm';
import { MilestoneGoalForm } from '../GoalCreator/MilestoneGoalForm';
import { StreakGoalForm } from '../GoalCreator/StreakGoalForm';
import { LimitGoalForm } from '../GoalCreator/LimitGoalForm';
import { createGoal } from '../../services/goalService';
import { ArrowLeft, Sparkles } from 'lucide-react';

type GoalFormData = RecurringGoalFormData | TargetGoalFormData | MilestoneGoalFormData | StreakGoalFormData | LimitGoalFormData;

const GoalWizard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPattern, setSelectedPattern] = useState<GoalPattern | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      navigate(`/goals/${goal.goalId}`);
    },
  });

  const handlePatternSelect = (pattern: GoalPattern) => {
    setSelectedPattern(pattern);
  };

  const handleBack = () => {
    setSelectedPattern(null);
  };

  const handleCancel = () => {
    navigate('/goals');
  };

  const transformFormDataToRequest = (formData: GoalFormData): CreateGoalRequest => {
    // Common fields
    const baseRequest: Partial<CreateGoalRequest> = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      icon: formData.icon,
      color: formData.color,
      goalPattern: formData.goalPattern,
    };

    // Transform based on goal pattern
    switch (formData.goalPattern) {
      case 'recurring': {
        const data = formData as RecurringGoalFormData;
        return {
          ...baseRequest,
          target: {
            metric: 'count',
            value: data.targetValue,
            unit: data.unit,
            period: data.period,
            direction: 'increase',
            targetType: 'minimum',
          },
          schedule: {
            frequency: data.frequency,
            daysOfWeek: data.daysOfWeek && data.daysOfWeek.length > 0 ? data.daysOfWeek : undefined,
            checkInFrequency: 'daily',
            catchUpAllowed: true,
          },
        } as CreateGoalRequest;
      }

      case 'target': {
        const data = formData as TargetGoalFormData;
        return {
          ...baseRequest,
          target: {
            metric: 'custom',
            value: data.targetValue,
            unit: data.unit,
            direction: data.direction,
            targetType: 'exact',
            startValue: data.startValue,
            currentValue: data.startValue,
            targetDate: data.targetDate.toISOString(),
          },
        } as CreateGoalRequest;
      }

      case 'milestone': {
        const data = formData as MilestoneGoalFormData;
        return {
          ...baseRequest,
          target: {
            metric: 'custom',
            value: data.targetValue,
            unit: data.unit,
            direction: 'increase',
            targetType: 'exact',
            startValue: data.currentValue || 0,
            currentValue: data.currentValue || 0,
            targetDate: data.targetDate?.toISOString(),
          },
        } as CreateGoalRequest;
      }

      case 'streak': {
        const data = formData as StreakGoalFormData;
        return {
          ...baseRequest,
          target: {
            metric: 'count',
            value: data.targetStreak,
            unit: data.unit || 'days',
            direction: 'increase',
            targetType: 'exact',
          },
          schedule: {
            frequency: data.frequency || 'daily',
            checkInFrequency: data.frequency || 'daily',
            allowSkipDays: 0,
            catchUpAllowed: false,
          },
        } as CreateGoalRequest;
      }

      case 'limit': {
        const data = formData as LimitGoalFormData;
        return {
          ...baseRequest,
          target: {
            metric: 'custom',
            value: data.limitValue,
            unit: data.unit,
            period: data.period,
            direction: data.targetType === 'maximum' ? 'decrease' : 'increase',
            targetType: data.targetType,
          },
          schedule: {
            checkInFrequency: 'daily',
          },
        } as CreateGoalRequest;
      }

      default:
        throw new Error(`Unknown goal pattern: ${formData.goalPattern}`);
    }
  };

  const handleFormSubmit = async (formData: GoalFormData) => {
    setIsSubmitting(true);
    try {
      const goalData = transformFormDataToRequest(formData);
      await createGoalMutation.mutateAsync(goalData);
    } catch (error) {
      console.error('Failed to create goal:', error);
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    if (!selectedPattern) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Goal</h1>
            <p className="text-lg text-gray-600">Choose a pattern that fits your journey</p>
          </div>
          <PatternSelector
            onSelect={handlePatternSelect}
            selectedPattern={selectedPattern}
          />
        </div>
      );
    }

    // Render the appropriate form based on selected pattern
    const commonProps = {
      onSubmit: handleFormSubmit,
      onCancel: handleBack,
    };

    switch (selectedPattern) {
      case 'recurring':
        return <RecurringGoalForm {...commonProps} />;
      case 'target':
        return <TargetGoalForm {...commonProps} />;
      case 'milestone':
        return <MilestoneGoalForm {...commonProps} />;
      case 'streak':
        return <StreakGoalForm {...commonProps} />;
      case 'limit':
        return <LimitGoalForm {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Navigation */}
      <div className="mb-6">
        <button
          onClick={selectedPattern ? handleBack : handleCancel}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {selectedPattern ? 'Choose Different Pattern' : 'Back to Goals'}
        </button>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 sm:p-8">
          {renderForm()}
        </div>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-700 font-medium">Creating your goal...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalWizard;

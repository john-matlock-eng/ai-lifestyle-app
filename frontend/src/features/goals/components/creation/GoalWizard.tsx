import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GoalPattern, CreateGoalRequest, GoalTarget, GoalSchedule, GoalContext } from '../../types/api.types';
import { getDefaultsByPattern } from '../../types/ui.types';
import PatternSelector from './PatternSelector';
import BasicInfoStep from './BasicInfoStep';
import TargetStep from './TargetStep';
import ScheduleStep from './ScheduleStep';
import MotivationStep from './MotivationStep';
import ReviewStep from './ReviewStep';
import Button from '../../../../components/common/Button';
import { createGoal } from '../../services/goalService';

type WizardStep = 'pattern' | 'basic-info' | 'target' | 'schedule' | 'motivation' | 'review';

interface GoalWizardState extends Partial<CreateGoalRequest> {
  pattern?: GoalPattern;
}

const GoalWizard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<WizardStep>('pattern');
  const [wizardState, setWizardState] = useState<GoalWizardState>({});

  const steps: WizardStep[] = ['pattern', 'basic-info', 'target', 'schedule', 'motivation', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      navigate(`/goals/${goal.goalId}`);
    },
  });

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handlePatternSelect = (pattern: GoalPattern) => {
    const defaults = getDefaultsByPattern(pattern);
    setWizardState({
      ...wizardState,
      goalPattern: pattern,
      target: {
        metric: 'count',
        value: 0,
        unit: '',
        direction: defaults.direction,
        targetType: defaults.targetType,
        period: defaults.period,
      },
    });
    handleNext();
  };

  const handleBasicInfoComplete = (data: { title: string; description?: string; category: string; icon?: string; color?: string }) => {
    setWizardState({ ...wizardState, ...data });
    handleNext();
  };

  const handleTargetComplete = (target: GoalTarget) => {
    setWizardState({ ...wizardState, target });
    handleNext();
  };

  const handleScheduleComplete = (schedule: GoalSchedule) => {
    setWizardState({ ...wizardState, schedule });
    handleNext();
  };

  const handleMotivationComplete = (context: GoalContext) => {
    setWizardState({ ...wizardState, context });
    handleNext();
  };

  const handleSubmit = async () => {
    if (!wizardState.goalPattern || !wizardState.title || !wizardState.category || !wizardState.target) {
      return;
    }

    const goalData: CreateGoalRequest = {
      title: wizardState.title,
      description: wizardState.description,
      category: wizardState.category,
      icon: wizardState.icon,
      color: wizardState.color,
      goalPattern: wizardState.goalPattern,
      target: wizardState.target,
      schedule: wizardState.schedule,
      context: wizardState.context,
    };

    await createGoalMutation.mutateAsync(goalData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'pattern':
        return (
          <PatternSelector
            onSelect={handlePatternSelect}
            selectedPattern={wizardState.goalPattern}
          />
        );
      case 'basic-info':
        return (
          <BasicInfoStep
            initialValues={{
              title: wizardState.title || '',
              description: wizardState.description,
              category: wizardState.category || '',
              icon: wizardState.icon,
              color: wizardState.color,
            }}
            onComplete={handleBasicInfoComplete}
          />
        );
      case 'target':
        return (
          <TargetStep
            pattern={wizardState.goalPattern!}
            initialValues={wizardState.target}
            onComplete={handleTargetComplete}
          />
        );
      case 'schedule':
        return (
          <ScheduleStep
            pattern={wizardState.goalPattern!}
            initialValues={wizardState.schedule}
            onComplete={handleScheduleComplete}
          />
        );
      case 'motivation':
        return (
          <MotivationStep
            initialValues={wizardState.context}
            onComplete={handleMotivationComplete}
          />
        );
      case 'review':
        return (
          <ReviewStep
            goalData={wizardState as CreateGoalRequest}
            onSubmit={handleSubmit}
            isSubmitting={createGoalMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Create New Goal</h1>
          <span className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6">{renderStep()}</div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 ? () => navigate('/goals') : handleBack}
          disabled={createGoalMutation.isPending}
        >
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep !== 'pattern' && currentStep !== 'review' && (
          <Button onClick={handleNext} disabled={createGoalMutation.isPending}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default GoalWizard;

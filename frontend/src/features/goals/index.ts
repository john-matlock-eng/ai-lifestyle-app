// Export all goals components
export { default as GoalList } from './components/display/GoalList';
export { default as GoalCard } from './components/display/GoalCard';
export { default as GoalWizard } from './components/creation/GoalWizard';
export { default as PatternSelector } from './components/creation/PatternSelector';
export { default as QuickLogModal } from './components/logging/QuickLogModal';
export { default as ActivityHistory } from './components/GoalProgress/ActivityHistory';

// Export types
export * from './types/api.types';
export * from './types/ui.types';

// Export services
export * from './services/goalService';

// Export hooks
export { 
  default as useGoalManagement,
  useGoals,
  useGoal,
  useCreateGoal,
  useUpdateGoal,
  useArchiveGoal,
  useLogActivity,
  useGoalProgress
} from './hooks/useGoals';

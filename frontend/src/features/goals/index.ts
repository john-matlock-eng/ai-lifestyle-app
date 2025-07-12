// Export all goals components
export { default as GoalList } from './components/display/GoalList';
export { default as GoalCard } from './components/display/GoalCard';
export { default as GoalWizard } from './components/creation/GoalWizard';
export { default as PatternSelector } from './components/creation/PatternSelector';
export { default as QuickLogModal } from './components/logging/QuickLogModal';
export { default as ActivityHistory } from './components/GoalProgress/ActivityHistory';
export { default as EnhancedActivityLog } from './components/logging/EnhancedActivityLog';
export {
  ProgressRing,
  GoalProgressRing,
  MiniProgressRing,
} from './components/GoalProgress/ProgressRing';
export { StreakCalendar, StreakBadge } from './components/GoalProgress/StreakCalendar';
export { default as ProgressCharts } from './components/GoalProgress/ProgressCharts';
export { TrendLine } from './components/GoalProgress/TrendLine';
export { MilestoneChart, MilestoneBar } from './components/GoalProgress/MilestoneChart';

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

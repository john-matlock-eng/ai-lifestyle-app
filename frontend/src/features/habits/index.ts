// Export components
export { DailyHabitTracker } from "./components/DailyHabitTracker";
export { HabitCard } from "./components/HabitCard";
export { WeeklyProgressChart } from "./components/WeeklyProgressChart";
export { MotivationalQuote } from "./components/MotivationalQuote";
export { QuickStats } from "./components/QuickStats";
export { ProgressRing } from "./components/ProgressRing";
export { StreakBadge } from "./components/StreakBadge";

// Export hooks
export { useHabits } from "./hooks/useHabits";

// Export services
export { habitService } from "./services/habitService";

// Export types
export type {
  Habit,
  HabitCheckIn,
  UserStats,
  CreateHabitRequest,
  UpdateHabitRequest,
  HabitCheckInRequest,
  HabitAnalytics,
} from "@/types/habits";

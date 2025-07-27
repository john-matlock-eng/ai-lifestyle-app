/**
 * Type definitions for habit tracking feature
 */

export type HabitPattern = "daily" | "weekly" | "custom";

export type HabitCategory =
  | "health"
  | "fitness"
  | "productivity"
  | "mindfulness"
  | "learning"
  | "social"
  | "creative"
  | "financial"
  | "other";

export type HabitTrend = "improving" | "declining" | "stable";

/**
 * Base habit interface
 */
export interface Habit {
  id: string;
  userId: string;

  // Basic Info
  title: string;
  description?: string;
  category: HabitCategory;
  icon: string;
  color: string;

  // Tracking
  pattern: HabitPattern;
  targetDays: number;
  currentStreak: number;
  longestStreak: number;
  lastCompleted?: string; // ISO date string

  // Today's Status
  completedToday: boolean;
  skippedToday: boolean;

  // Weekly Progress (last 7 days)
  weekProgress: boolean[];

  // Gamification
  points: number;
  bonusMultiplier: number;

  // UI
  displayOrder: number;
  showOnDashboard: boolean;
  motivationalText?: string;
  reminderTime?: string;

  // Links
  goalId?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Request to create a new habit
 */
export interface CreateHabitRequest {
  title: string;
  description?: string;
  category: HabitCategory;
  icon: string;
  color: string;
  pattern: HabitPattern;
  targetDays: number;
  motivationalText?: string;
  reminderTime?: string;
  goalId?: string;
  showOnDashboard?: boolean;
}

/**
 * Request to update an existing habit
 */
export interface UpdateHabitRequest {
  title?: string;
  description?: string;
  category?: HabitCategory;
  icon?: string;
  color?: string;
  targetDays?: number;
  motivationalText?: string;
  reminderTime?: string;
  showOnDashboard?: boolean;
  displayOrder?: number;
}

/**
 * Request to check in a habit
 */
export interface HabitCheckInRequest {
  completed: boolean;
  note?: string;
  value?: number;
}

/**
 * Response from habit check-in
 */
export interface HabitCheckIn {
  habitId: string;
  date: string; // ISO date string
  completed: boolean;
  skipped: boolean;
  value?: number;
  note?: string;
  points: number;
  streakContinued: boolean;
  currentStreak: number;
  milestoneReached?: number;
  bonusEarned: boolean;
}

/**
 * User gamification stats
 */
export interface UserStats {
  totalPoints: number;
  currentLevel: number;
  nextLevelProgress: number;
  weeklyStreak: number;
  perfectDays: number;
  totalCheckIns: number;
  habitsCompletedToday: number;
  totalHabits: number;
}

/**
 * Response for listing habits with stats
 */
export interface HabitListResponse {
  habits: Habit[];
  stats: UserStats;
}

/**
 * Habit analytics data
 */
export interface HabitAnalytics {
  habitId: string;
  period: "week" | "month" | "year";
  completionRate: number;
  averageStreak: number;
  bestTimeOfDay?: string;
  totalCompletions: number;
  missedDays: number;
  currentTrend: HabitTrend;
  correlations: HabitCorrelation[];
}

/**
 * Correlation between habits
 */
export interface HabitCorrelation {
  habitId: string;
  habitTitle: string;
  correlation: number;
}

/**
 * Habit milestone configuration
 */
export interface HabitMilestone {
  days: number;
  label: string;
  icon: string;
  points: number;
}

/**
 * Default milestones
 */
export const HABIT_MILESTONES: HabitMilestone[] = [
  { days: 7, label: "One Week", icon: "🔥", points: 50 },
  { days: 14, label: "Two Weeks", icon: "⚡", points: 75 },
  { days: 21, label: "Three Weeks", icon: "🌟", points: 100 },
  { days: 30, label: "One Month", icon: "🏆", points: 150 },
  { days: 60, label: "Two Months", icon: "💎", points: 200 },
  { days: 90, label: "Three Months", icon: "👑", points: 300 },
  { days: 180, label: "Six Months", icon: "🌈", points: 500 },
  { days: 365, label: "One Year", icon: "🎉", points: 1000 },
];

/**
 * Habit category configuration
 */
export interface HabitCategoryConfig {
  value: HabitCategory;
  label: string;
  icon: string;
  color: string;
}

/**
 * Default category configurations
 */
export const HABIT_CATEGORIES: HabitCategoryConfig[] = [
  { value: "health", label: "Health", icon: "❤️", color: "#EF4444" },
  { value: "fitness", label: "Fitness", icon: "💪", color: "#F59E0B" },
  {
    value: "productivity",
    label: "Productivity",
    icon: "📈",
    color: "#3B82F6",
  },
  { value: "mindfulness", label: "Mindfulness", icon: "🧘", color: "#8B5CF6" },
  { value: "learning", label: "Learning", icon: "📚", color: "#10B981" },
  { value: "social", label: "Social", icon: "👥", color: "#EC4899" },
  { value: "creative", label: "Creative", icon: "🎨", color: "#F97316" },
  { value: "financial", label: "Financial", icon: "💰", color: "#84CC16" },
  { value: "other", label: "Other", icon: "📌", color: "#6B7280" },
];

/**
 * Level configuration
 */
export interface LevelConfig {
  level: number;
  minPoints: number;
  maxPoints: number;
  label: string;
  icon: string;
}

/**
 * Get level configuration for a given level
 */
export function getLevelConfig(level: number): LevelConfig {
  const baseConfigs: LevelConfig[] = [
    { level: 1, minPoints: 0, maxPoints: 99, label: "Beginner", icon: "🌱" },
    { level: 2, minPoints: 100, maxPoints: 199, label: "Novice", icon: "🌿" },
    {
      level: 3,
      minPoints: 200,
      maxPoints: 299,
      label: "Apprentice",
      icon: "🌳",
    },
    { level: 4, minPoints: 300, maxPoints: 399, label: "Adept", icon: "⭐" },
    { level: 5, minPoints: 400, maxPoints: 499, label: "Expert", icon: "🌟" },
  ];

  if (level <= 5) {
    return baseConfigs[level - 1];
  }

  // For levels above 5, calculate dynamically
  const minPoints = (level - 1) * 100;
  const maxPoints = level * 100 - 1;
  return {
    level,
    minPoints,
    maxPoints,
    label: `Master ${level - 5}`,
    icon: "👑",
  };
}

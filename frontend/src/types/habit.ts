// Habit tracking types
export interface Habit {
  id: string;
  goalId?: string; // Links to existing goal system
  userId: string;

  // Basic Info
  title: string;
  description?: string;
  category:
    | "health"
    | "productivity"
    | "learning"
    | "fitness"
    | "mindfulness"
    | "custom";
  icon: string;
  color: string;

  // Tracking
  frequency: "daily" | "weekly" | "custom";
  targetDays?: number; // For weekly habits or custom patterns
  targetPerWeek?: number; // How many times per week
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string; // ISO date string

  // Today's Status
  completedToday: boolean;
  skippedToday: boolean;

  // Weekly Progress (last 7 days, Sunday to Saturday)
  weekProgress: boolean[];

  // Stats
  totalCompletions: number;
  createdAt: string;
  updatedAt: string;
}

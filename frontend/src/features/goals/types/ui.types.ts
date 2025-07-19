// UI-specific types and configurations for goals
import type {
  GoalPattern,
  Metric,
  Period,
  Direction,
  TargetType,
} from "./api.types";

export interface GoalPatternConfig {
  id: GoalPattern;
  icon: string;
  title: string;
  description: string;
  examples: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

export const GOAL_PATTERNS: Record<GoalPattern, GoalPatternConfig> = {
  recurring: {
    id: "recurring",
    icon: "🔄",
    title: "Build a Habit",
    description: "Do something regularly",
    examples: ["Exercise daily", "Read 30 min/day", "Meditate every morning"],
    color: "#3B82F6", // blue-500
    bgColor: "bg-blue-50",
    borderColor: "border-blue-500",
  },
  milestone: {
    id: "milestone",
    icon: "🎯",
    title: "Reach a Total",
    description: "Accumulate over time",
    examples: ["Read 50 books", "Save $5000", "Run 500 miles total"],
    color: "#8B5CF6", // purple-500
    bgColor: "bg-purple-50",
    borderColor: "border-purple-500",
  },
  target: {
    id: "target",
    icon: "🏁",
    title: "Hit a Target",
    description: "Achieve by deadline",
    examples: [
      "Lose 20 lbs by June",
      "Finish project by Q2",
      "Learn Spanish B2 level",
    ],
    color: "#10B981", // green-500
    bgColor: "bg-green-50",
    borderColor: "border-green-500",
  },
  streak: {
    id: "streak",
    icon: "🔥",
    title: "Build a Streak",
    description: "Consecutive days",
    examples: [
      "100 day code streak",
      "No smoking 30 days",
      "Daily journal entries",
    ],
    color: "#F59E0B", // orange-500
    bgColor: "bg-orange-50",
    borderColor: "border-orange-500",
  },
  limit: {
    id: "limit",
    icon: "🛑",
    title: "Set a Limit",
    description: "Stay under threshold",
    examples: [
      "< 2000 calories/day",
      "Max 2 hours TV",
      "< $50/week eating out",
    ],
    color: "#EF4444", // red-500
    bgColor: "bg-red-50",
    borderColor: "border-red-500",
  },
};

// Common metric options for goal creation
export const METRIC_OPTIONS: Array<{
  value: Metric;
  label: string;
  units: string[];
}> = [
  {
    value: "count",
    label: "Count",
    units: ["times", "reps", "pages", "items", "tasks"],
  },
  {
    value: "duration",
    label: "Duration",
    units: ["minutes", "hours", "seconds"],
  },
  {
    value: "amount",
    label: "Amount",
    units: ["liters", "gallons", "cups", "glasses"],
  },
  { value: "weight", label: "Weight", units: ["lbs", "kg", "grams"] },
  {
    value: "distance",
    label: "Distance",
    units: ["miles", "km", "meters", "steps"],
  },
  { value: "calories", label: "Calories", units: ["cal", "kcal"] },
  { value: "money", label: "Money", units: ["dollars", "euros", "pounds"] },
  { value: "custom", label: "Custom", units: [] },
];

// Period options for recurring and limit goals
export const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "year", label: "Yearly" },
];

// Common goal categories
export const GOAL_CATEGORIES = [
  { value: "fitness", label: "Fitness", icon: "💪" },
  { value: "nutrition", label: "Nutrition", icon: "🥗" },
  { value: "wellness", label: "Wellness", icon: "🧘" },
  { value: "productivity", label: "Productivity", icon: "📈" },
  { value: "learning", label: "Learning", icon: "📚" },
  { value: "finance", label: "Finance", icon: "💰" },
  { value: "relationships", label: "Relationships", icon: "❤️" },
  { value: "creativity", label: "Creativity", icon: "🎨" },
  { value: "mindfulness", label: "Mindfulness", icon: "🧠" },
  { value: "other", label: "Other", icon: "⭐" },
];

// Helper function to get default values based on pattern
export function getDefaultsByPattern(pattern: GoalPattern): {
  period?: Period;
  targetType: TargetType;
  direction: Direction;
} {
  const defaults = {
    recurring: {
      period: "day" as Period,
      targetType: "minimum" as TargetType,
      direction: "increase" as Direction,
    },
    milestone: {
      targetType: "exact" as TargetType,
      direction: "increase" as Direction,
    },
    target: {
      targetType: "exact" as TargetType,
      direction: "increase" as Direction,
    },
    streak: {
      targetType: "minimum" as TargetType,
      direction: "increase" as Direction,
      period: "day" as Period,
    },
    limit: {
      targetType: "maximum" as TargetType,
      direction: "maintain" as Direction,
      period: "day" as Period,
    },
  };
  return defaults[pattern];
}

// Helper to get appropriate unit suggestions based on metric
export function getUnitSuggestions(metric: Metric): string[] {
  const metricOption = METRIC_OPTIONS.find((m) => m.value === metric);
  return metricOption?.units || [];
}

// Helper to format goal value with unit
export function formatGoalValue(value: number, unit: string): string {
  // Handle plural forms
  if (
    value !== 1 &&
    !unit.endsWith("s") &&
    ["page", "rep", "item", "task", "time"].includes(unit)
  ) {
    return `${value} ${unit}s`;
  }
  return `${value} ${unit}`;
}

// Helper to get progress color based on percentage
export function getProgressColor(percent: number): string {
  if (percent >= 100) return "text-green-600";
  if (percent >= 75) return "text-blue-600";
  if (percent >= 50) return "text-yellow-600";
  if (percent >= 25) return "text-orange-600";
  return "text-red-600";
}

// Helper to get trend icon
export function getTrendIcon(
  trend: "improving" | "stable" | "declining",
): string {
  switch (trend) {
    case "improving":
      return "📈";
    case "stable":
      return "➡️";
    case "declining":
      return "📉";
  }
}

// Goal icons for customization
export const GOAL_ICONS = [
  "🎯",
  "💪",
  "🏃",
  "📚",
  "💰",
  "🧘",
  "🎨",
  "🌟",
  "⚡",
  "🔥",
  "🚀",
  "💡",
  "🏆",
  "🎪",
  "🌱",
  "⏰",
  "📈",
  "🎸",
  "✍️",
  "🗣️",
  "🏋️",
  "🚴",
  "🏊",
  "🥗",
  "💧",
  "😴",
  "🧠",
  "❤️",
  "🎭",
  "📷",
];

export interface GoalCategory {
  value: string;
  label: string;
  icon: string;
}

// Generated from OpenAPI contract - DO NOT EDIT MANUALLY
// These types match the backend API exactly

export type GoalPattern =
  | "recurring"
  | "milestone"
  | "target"
  | "streak"
  | "limit";
export type GoalStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";
export type GoalVisibility = "private" | "friends" | "public";
export type Metric =
  | "count"
  | "duration"
  | "amount"
  | "weight"
  | "distance"
  | "calories"
  | "money"
  | "custom";
export type Period = "day" | "week" | "month" | "quarter" | "year";
export type Direction = "increase" | "decrease" | "maintain";
export type TargetType = "minimum" | "maximum" | "exact" | "range";
export type Trend = "improving" | "stable" | "declining";
export type ActivityType = "progress" | "completed" | "skipped" | "partial";
export type TimeOfDay =
  | "early-morning"
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

export interface Goal {
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string; // Hex color like #FF5733
  goalPattern: GoalPattern;
  target: GoalTarget;
  schedule?: GoalSchedule;
  progress: GoalProgressDetails;
  context?: GoalContext;
  rewards?: GoalRewards;
  status: GoalStatus;
  visibility: GoalVisibility;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface GoalTarget {
  metric: Metric;
  value: number;
  unit: string;
  period?: Period;
  targetDate?: string;
  startValue?: number;
  currentValue?: number;
  direction: Direction;
  targetType: TargetType;
  minValue?: number;
  maxValue?: number;
}

export interface GoalSchedule {
  frequency?: "daily" | "weekly" | "monthly" | "custom";
  daysOfWeek?: number[]; // 0=Sunday, 6=Saturday
  preferredTimes?: string[]; // HH:MM format
  checkInFrequency?: "daily" | "weekly" | "monthly";
  allowSkipDays?: number;
  catchUpAllowed?: boolean;
}

export interface GoalProgressDetails {
  percentComplete: number; // 0-100
  lastActivityDate?: string;
  currentPeriodValue?: number;
  totalAccumulated?: number;
  remainingToGoal?: number;
  currentStreak?: number;
  longestStreak?: number;
  averageValue?: number;
  daysOverLimit?: number;
  trend: Trend;
  projectedCompletion?: string;
  successRate: number; // 0-100
  periodHistory?: PeriodHistory[];
}

export interface PeriodHistory {
  period: string;
  achieved: boolean;
  value: number;
}

export interface GoalContext {
  motivation?: string;
  importanceLevel?: number; // 1-5
  supportingGoals?: string[];
  conflictingGoals?: string[];
  obstacles?: string[];
  successFactors?: string[];
  preferredActivities?: string[];
  avoidActivities?: string[];
}

export interface GoalRewards {
  pointsPerActivity?: number;
  milestoneRewards?: MilestoneReward[];
  badges?: string[];
}

export interface MilestoneReward {
  value: number;
  reward: string;
  unlockedAt?: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  goalPattern: GoalPattern;
  target: GoalTarget;
  schedule?: GoalSchedule;
  context?: GoalContext;
  rewards?: GoalRewards;
  visibility?: GoalVisibility;
  metadata?: Record<string, unknown>;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  target?: Partial<GoalTarget>;
  schedule?: GoalSchedule;
  context?: GoalContext;
  rewards?: GoalRewards;
  status?: "active" | "paused";
  visibility?: GoalVisibility;
  metadata?: Record<string, unknown>;
}

export interface GoalActivity {
  activityId: string;
  goalId: string;
  userId: string;
  value: number;
  unit: string;
  activityType: ActivityType;
  activityDate: string;
  loggedAt: string;
  timezone: string;
  location?: ActivityLocation;
  context?: ActivityContext;
  note?: string;
  attachments?: ActivityAttachment[];
  source?: "manual" | "device" | "integration" | "import";
  deviceInfo?: DeviceInfo;
}

export interface LogActivityRequest {
  value: number;
  unit: string;
  activityType: ActivityType;
  activityDate?: string;
  location?: ActivityLocation;
  context?: ActivityContext;
  note?: string;
  attachments?: ActivityAttachmentRequest[];
  source?: "manual" | "device" | "integration" | "import";
}

export interface ActivityLocation {
  type?: "home" | "work" | "gym" | "outdoors" | "travel";
  city?: string;
  coordinates?: [number, number]; // [longitude, latitude]
}

export interface ActivityContext {
  timeOfDay?: TimeOfDay;
  dayOfWeek?: string;
  isWeekend?: boolean;
  isHoliday?: boolean;
  weather?: WeatherInfo;
  energyLevel?: number; // 1-10
  sleepHours?: number;
  stressLevel?: number; // 1-10
  withOthers?: boolean;
  socialContext?: "alone" | "partner" | "friends" | "group" | "online";
  previousActivity?: string;
  nextActivity?: string;
  duration?: number; // minutes
  difficulty?: number; // 1-5
  enjoyment?: number; // 1-5
  mood?: string;
}

export interface WeatherInfo {
  condition?: string;
  temperature?: number; // Celsius
  humidity?: number; // 0-100
}

export interface ActivityAttachment {
  type: "image" | "link" | "reference";
  url: string;
  entityId?: string;
}

export interface ActivityAttachmentRequest {
  type: "image" | "link" | "reference";
  url?: string;
  entityId?: string;
}

export interface DeviceInfo {
  type?: string;
  model?: string;
  appVersion?: string;
}

export interface GoalProgress {
  goalId: string;
  period: "current" | "week" | "month" | "quarter" | "year" | "all";
  progress: GoalProgressDetails;
  statistics: GoalStatistics;
  insights?: GoalInsights;
}

export interface GoalStatistics {
  totalActivities?: number;
  completedActivities?: number;
  skippedActivities?: number;
  averageValue?: number;
  bestValue?: number;
  worstValue?: number;
  consistency?: number; // 0-100
}

export interface GoalInsights {
  bestTimeOfDay?: TimeOfDay;
  bestDayOfWeek?: string;
  successPatterns?: string[];
  recommendations?: string[];
}

export interface GoalListResponse {
  goals: Goal[];
  pagination: PaginationInfo;
}

export interface GoalActivityListResponse {
  activities: GoalActivity[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Filter types for API requests
export interface GoalFilters {
  status?: GoalStatus[];
  goalPattern?: GoalPattern[];
  category?: string[];
}

export interface GoalSortOption {
  field: "created_at" | "updated_at" | "title";
  order: "asc" | "desc";
}

// Goal System Types - Based on Enhanced Goal System Design v2

export type GoalPattern = 'recurring' | 'milestone' | 'target' | 'streak' | 'limit';

export type MetricType = 'count' | 'duration' | 'amount' | 'weight' | 'distance' | 'calories' | 'money' | 'custom';

export type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export type Direction = 'increase' | 'decrease' | 'maintain';

export type TargetType = 'minimum' | 'maximum' | 'exact' | 'range';

export type GoalStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type Visibility = 'private' | 'friends' | 'public';

export type TimeOfDay = 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'night';

export type LocationType = 'home' | 'work' | 'gym' | 'outdoors' | 'travel';

export type SocialContext = 'alone' | 'partner' | 'friends' | 'group' | 'online';

export type Trend = 'improving' | 'stable' | 'declining';

export type ActivityType = 'progress' | 'completed' | 'skipped' | 'partial';

export type Source = 'manual' | 'device' | 'integration' | 'import';

// Main Goal Interface
export interface Goal {
  // Identification
  goalId: string;
  userId: string;
  
  // Basic Info
  title: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  
  // Goal Pattern - THE KEY FIELD
  goalPattern: GoalPattern;
  
  // Flexible Target Definition
  target: GoalTarget;
  
  // Smart Scheduling
  schedule: GoalSchedule;
  
  // Progress Tracking
  progress: GoalProgress;
  
  // AI-Friendly Context
  context: GoalContext;
  
  // Gamification
  rewards: GoalRewards;
  
  // Status
  status: GoalStatus;
  visibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Feature-specific extensions
  metadata?: Record<string, unknown>;
}

export interface GoalTarget {
  // What to measure
  metric: MetricType;
  
  // The goal value
  value: number;
  unit: string;  // steps, words, pounds, dollars, minutes, etc.
  
  // For recurring/limit goals
  period?: Period;
  
  // For milestone/target goals  
  targetDate?: Date;
  startValue?: number;      // Starting point (weight, savings, etc.)
  currentValue?: number;    // Latest measurement
  
  // Goal direction
  direction: Direction;
  targetType: TargetType;
  
  // For ranges
  minValue?: number;
  maxValue?: number;
}

export interface GoalSchedule {
  // When to work on goal
  frequency?: Frequency;
  daysOfWeek?: number[];
  preferredTimes?: string[];
  
  // When to check progress
  checkInFrequency: Frequency;
  
  // Flexibility
  allowSkipDays?: number;   // Can skip X days per period
  catchUpAllowed?: boolean; // Can make up missed days
}

export interface GoalProgress {
  // Universal progress
  percentComplete: number;
  lastActivityDate?: Date;
  
  // For recurring goals
  currentPeriodValue?: number;
  periodHistory?: PeriodHistory[];
  
  // For milestone goals
  totalAccumulated?: number;
  remainingToGoal?: number;
  
  // For streak goals
  currentStreak?: number;
  longestStreak?: number;
  targetStreak?: number;
  
  // For limit goals
  averageValue?: number;
  daysOverLimit?: number;
  
  // Trends
  trend: Trend;
  projectedCompletion?: Date;
  successRate: number;
}

export interface PeriodHistory {
  period: string;
  achieved: boolean;
  value: number;
}

export interface GoalContext {
  // Why this goal
  motivation?: string;
  importanceLevel: 1 | 2 | 3 | 4 | 5;
  
  // Related goals
  supportingGoals?: string[];   // Goals that help this one
  conflictingGoals?: string[];  // Goals that compete
  
  // Personal factors
  obstacles?: string[];
  successFactors?: string[];
  
  // Preferences
  preferredActivities?: string[];
  avoidActivities?: string[];
}

export interface GoalRewards {
  pointsPerActivity: number;
  milestoneRewards: MilestoneReward[];
  badges: string[];
}

export interface MilestoneReward {
  value: number;
  reward: string;
  unlockedAt?: Date;
}

// Goal Activity Interface
export interface GoalActivity {
  activityId: string;
  goalId: string;
  userId: string;
  
  // What happened
  value: number;
  unit: string;
  activityType: ActivityType;
  
  // When & Where
  activityDate: Date;
  loggedAt: Date;
  timezone: string;
  location?: ActivityLocation;
  
  // Rich Context for AI
  context: ActivityContext;
  
  // Evidence
  note?: string;
  attachments?: ActivityAttachment[];
  
  // Integration
  source: Source;
  deviceInfo?: DeviceInfo;
}

export interface ActivityLocation {
  type: LocationType;
  city?: string;
  coordinates?: [number, number];
}

export interface ActivityContext {
  // Temporal
  timeOfDay: TimeOfDay;
  dayOfWeek: string;
  isWeekend: boolean;
  isHoliday: boolean;
  
  // Environmental
  weather?: Weather;
  
  // Physical state
  energyLevel?: number;  // 1-10
  sleepHours?: number;
  stressLevel?: number; // 1-10
  
  // Social context
  withOthers: boolean;
  socialContext?: SocialContext;
  
  // Activity flow
  previousActivity?: string;
  nextActivity?: string;
  duration?: number;
  
  // Subjective
  difficulty?: 1 | 2 | 3 | 4 | 5;
  enjoyment?: 1 | 2 | 3 | 4 | 5;
  mood?: string;
}

export interface Weather {
  condition: string;
  temperature: number;
  humidity: number;
}

export interface ActivityAttachment {
  type: 'image' | 'link' | 'reference';
  url: string;
  entityId?: string;
}

export interface DeviceInfo {
  type: string;
  model: string;
  appVersion: string;
}

// Form Types for Creating Goals
export interface GoalFormData {
  title: string;
  description?: string;
  category: string;
  goalPattern: GoalPattern;
  icon?: string;
  color?: string;
}

// Pattern-specific form data
export interface RecurringGoalFormData extends GoalFormData {
  targetValue: number;
  unit: string;
  period: Period;
  frequency: Frequency;
  daysOfWeek?: number[];
}

export interface MilestoneGoalFormData extends GoalFormData {
  targetValue: number;
  unit: string;
  currentValue?: number;
  targetDate?: Date;
}

export interface TargetGoalFormData extends GoalFormData {
  targetValue: number;
  unit: string;
  startValue: number;
  targetDate: Date;
  direction: Direction;
}

export interface StreakGoalFormData extends GoalFormData {
  targetStreak: number;
  unit: string;
  frequency: Frequency;
}

export interface LimitGoalFormData extends GoalFormData {
  limitValue: number;
  unit: string;
  period: Period;
  targetType: 'maximum' | 'minimum';
}

// Goal Pattern Configuration
export interface GoalPatternConfig {
  pattern: GoalPattern;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  example: string;
}

// Goal Category
export interface GoalCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Predefined categories
export const GOAL_CATEGORIES: GoalCategory[] = [
  { id: 'health', name: 'Health & Fitness', icon: '💪', color: '#10B981' },
  { id: 'wellness', name: 'Mental Wellness', icon: '🧘', color: '#8B5CF6' },
  { id: 'productivity', name: 'Productivity', icon: '📈', color: '#3B82F6' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#F59E0B' },
  { id: 'learning', name: 'Learning', icon: '📚', color: '#EC4899' },
  { id: 'social', name: 'Social & Relationships', icon: '👥', color: '#6366F1' },
  { id: 'creative', name: 'Creative', icon: '🎨', color: '#F97316' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '🌟', color: '#14B8A6' },
];

// Common units for different metrics
export const METRIC_UNITS: Record<MetricType, string[]> = {
  count: ['times', 'reps', 'pages', 'words', 'items', 'sessions'],
  duration: ['minutes', 'hours', 'days'],
  amount: ['glasses', 'cups', 'servings', 'portions'],
  weight: ['lbs', 'kg', 'grams'],
  distance: ['miles', 'km', 'meters', 'steps'],
  calories: ['kcal', 'calories'],
  money: ['$', '€', '£', '¥'],
  custom: [],
};

// Goal pattern colors (from design doc)
export const GOAL_PATTERN_COLORS: Record<GoalPattern, string> = {
  recurring: '#3B82F6',  // Blue
  milestone: '#8B5CF6',  // Purple
  target: '#10B981',     // Green
  streak: '#F59E0B',     // Orange
  limit: '#EF4444',      // Red
};

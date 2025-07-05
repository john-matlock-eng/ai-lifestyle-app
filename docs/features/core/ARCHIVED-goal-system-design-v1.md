# Core Goal System - Universal Design

## Overview
A flexible, reusable goal system that can power various lifestyle features including journaling, fitness, nutrition, reading, meditation, and any future modules.

## Base Goal Model

### 1. Core Goal Entity
```typescript
interface Goal {
  // Identification
  goalId: string;              // GOAL#{uuid}
  userId: string;              // USER#{userId}
  goalType: GoalType;          // 'journal' | 'workout' | 'nutrition' | 'reading' | 'meditation' | 'custom'
  
  // Basic Info
  title: string;               // "Read 30 minutes daily"
  description?: string;        // "Build a consistent reading habit"
  category: string;            // Feature-specific categories
  icon?: string;               // Visual identifier
  color?: string;              // UI theming
  
  // Target Definition
  target: {
    metric: string;           // 'count' | 'duration' | 'amount' | 'boolean'
    value: number;            // 30 (minutes), 3 (workouts), 1 (entry)
    unit?: string;            // 'minutes', 'times', 'pages', 'calories'
    period: Period;           // 'day' | 'week' | 'month'
  };
  
  // Schedule
  schedule: {
    frequency: FrequencyType;  // 'daily' | 'weekly' | 'monthly' | 'custom'
    daysOfWeek?: number[];     // [1,3,5] for Mon/Wed/Fri
    daysOfMonth?: number[];    // [1,15] for 1st and 15th
    timesPerPeriod?: number;   // 3 times per week
    preferredTimes?: string[]; // ['morning', 'evening'] or ['09:00', '21:00']
    customCron?: string;       // Advanced scheduling
  };
  
  // Reminders
  reminders: {
    enabled: boolean;
    type: 'push' | 'email' | 'sms' | 'in-app';
    timing: 'at-time' | 'before' | 'after';
    offsetMinutes?: number;    // -30 for 30min before
    message?: string;          // Custom reminder text
  }[];
  
  // Progress Tracking
  progress: {
    currentValue: number;      // Progress toward target
    currentStreak: number;     // Consecutive periods met
    longestStreak: number;     // Best streak achieved
    totalCompleted: number;    // All-time completions
    lastActivityDate?: Date;   // Last time goal was worked on
    percentComplete: number;   // For time-bound goals
  };
  
  // Rules & Validation
  rules: {
    minValue?: number;         // Minimum to count (e.g., 10 min workout)
    maxValue?: number;         // Maximum per period
    rollover: boolean;         // Can excess carry to next period?
    partialCredit: boolean;    // Count progress even if not met?
    skipDays?: string[];       // ['Sunday'] or dates to exclude
  };
  
  // Status & Lifecycle
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  visibility: 'private' | 'friends' | 'public';
  startDate: Date;
  endDate?: Date;              // For time-bound goals
  pausedAt?: Date;
  completedAt?: Date;
  
  // Gamification
  rewards: {
    points: number;            // Points per completion
    badges: string[];          // Unlocked badges
    milestones: {              // Special achievements
      value: number;
      reward: string;
      unlockedAt?: Date;
    }[];
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: string;             // Schema version for migrations
  
  // Feature-Specific Data
  metadata: Record<string, any>; // Extensible for each feature
}
```

### 2. Goal Activity/Check-in
```typescript
interface GoalActivity {
  activityId: string;          // ACTIVITY#{uuid}
  goalId: string;              // Reference to goal
  userId: string;
  
  // What happened
  activityType: 'check-in' | 'progress' | 'completed' | 'skipped';
  value: number;               // Amount completed
  unit?: string;               // Unit of measurement
  
  // When
  activityDate: Date;          // When it happened
  loggedAt: Date;              // When it was recorded
  
  // Context
  note?: string;               // User notes
  mood?: string;               // How they felt
  difficulty?: number;         // 1-5 difficulty rating
  location?: string;           // Where it happened
  
  // Evidence
  attachments?: {
    type: 'image' | 'link' | 'reference';
    url: string;
    entityId?: string;         // Link to journal entry, workout, etc.
  }[];
  
  // Metadata
  source: 'manual' | 'automatic' | 'import' | 'integration';
  deviceInfo?: Record<string, any>;
}
```

### 3. Goal Templates
```typescript
interface GoalTemplate {
  templateId: string;
  goalType: GoalType;
  
  // Template Info
  name: string;                // "Couch to 5K"
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;           // Weeks to complete
  
  // Pre-configured Goal
  defaultGoal: Partial<Goal>;
  
  // Progressive Structure
  phases?: {
    week: number;
    adjustments: Partial<Goal>; // Modifications per phase
  }[];
  
  // Community
  popularity: number;          // Usage count
  rating: number;              // User ratings
  tags: string[];
  
  // Metadata
  createdBy: 'system' | 'community' | 'expert';
  isPublic: boolean;
}
```

## Feature-Specific Extensions

### Journaling Goals
```typescript
interface JournalingGoalMetadata {
  prompts?: {
    promptId: string;
    text: string;
    order: number;
    optional: boolean;
  }[];
  useAiPrompts?: boolean;
  preferredTopics?: string[];
  privacyLevel?: 'private' | 'shared';
}
```

### Fitness Goals
```typescript
interface FitnessGoalMetadata {
  exerciseType?: string[];     // ['running', 'strength']
  equipment?: string[];        // ['dumbbells', 'treadmill']
  muscleGroups?: string[];     // ['chest', 'legs']
  intensityLevel?: 'low' | 'moderate' | 'high';
}
```

### Nutrition Goals
```typescript
interface NutritionGoalMetadata {
  nutrientTargets?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  mealTypes?: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
  dietaryPreferences?: string[];
}
```

### Reading Goals
```typescript
interface ReadingGoalMetadata {
  genres?: string[];
  format?: 'physical' | 'ebook' | 'audiobook' | 'any';
  currentBook?: {
    title: string;
    author: string;
    totalPages?: number;
    currentPage?: number;
  };
}
```

## Usage Examples

### 1. Daily Journaling Goal
```typescript
const journalingGoal: Goal = {
  goalId: "GOAL#123",
  userId: "USER#456",
  goalType: "journal",
  title: "Daily Gratitude Journal",
  category: "gratitude",
  
  target: {
    metric: "count",
    value: 1,
    unit: "entry",
    period: "day"
  },
  
  schedule: {
    frequency: "daily",
    preferredTimes: ["21:00"]
  },
  
  reminders: [{
    enabled: true,
    type: "push",
    timing: "at-time",
    message: "Time for your gratitude journal!"
  }],
  
  metadata: {
    prompts: [{
      promptId: "prompt#1",
      text: "What are three things you're grateful for today?",
      order: 1,
      optional: false
    }],
    useAiPrompts: true
  }
};
```

### 2. Workout Goal
```typescript
const workoutGoal: Goal = {
  goalId: "GOAL#789",
  userId: "USER#456",
  goalType: "workout",
  title: "Strength Training 3x/week",
  category: "strength",
  
  target: {
    metric: "count",
    value: 3,
    unit: "workouts",
    period: "week"
  },
  
  schedule: {
    frequency: "weekly",
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    preferredTimes: ["07:00"]
  },
  
  rules: {
    minValue: 20, // Min 20 minutes to count
    partialCredit: true
  },
  
  metadata: {
    exerciseType: ["strength"],
    equipment: ["dumbbells", "barbell"],
    muscleGroups: ["full-body"]
  }
};
```

### 3. Reading Goal
```typescript
const readingGoal: Goal = {
  goalId: "GOAL#abc",
  userId: "USER#456",
  goalType: "reading",
  title: "Read 30 minutes before bed",
  category: "habit",
  
  target: {
    metric: "duration",
    value: 30,
    unit: "minutes",
    period: "day"
  },
  
  schedule: {
    frequency: "daily",
    preferredTimes: ["bedtime"]
  },
  
  metadata: {
    genres: ["fiction", "self-help"],
    format: "any"
  }
};
```

### 4. Nutrition Goal
```typescript
const nutritionGoal: Goal = {
  goalId: "GOAL#def",
  userId: "USER#456",
  goalType: "nutrition",
  title: "Cook dinner at home 5x/week",
  category: "healthy-eating",
  
  target: {
    metric: "count",
    value: 5,
    unit: "meals",
    period: "week"
  },
  
  schedule: {
    frequency: "weekly",
    daysOfWeek: [1, 2, 3, 4, 5] // Weekdays
  },
  
  metadata: {
    mealTypes: ["dinner"],
    dietaryPreferences: ["vegetarian"]
  }
};
```

## API Endpoints (Generic)

### Goal Management
```yaml
# CRUD Operations
POST   /goals                    # Create new goal
GET    /goals                    # List user's goals
GET    /goals/{goalId}          # Get specific goal
PUT    /goals/{goalId}          # Update goal
DELETE /goals/{goalId}          # Delete goal

# Goal Actions
POST   /goals/{goalId}/checkin  # Record progress
POST   /goals/{goalId}/pause    # Pause goal
POST   /goals/{goalId}/resume   # Resume goal
POST   /goals/{goalId}/complete # Mark as complete

# Templates
GET    /goals/templates         # Browse templates
POST   /goals/from-template     # Create from template

# Analytics
GET    /goals/{goalId}/stats    # Goal statistics
GET    /goals/summary           # All goals summary
```

## Database Schema (DynamoDB)

| PK | SK | Type | GSI1PK | GSI1SK | GSI2PK | GSI2SK |
|----|----|----|--------|--------|--------|--------|
| USER#123 | GOAL#456 | Goal | GOAL#456 | ACTIVE | TYPE#journal | 2024-01-15 |
| GOAL#456 | ACTIVITY#789 | GoalActivity | USER#123 | 2024-01-15 | - | - |
| SYSTEM | TEMPLATE#abc | GoalTemplate | TYPE#workout | POPULAR | PUBLIC | 4.5 |

## Benefits of This Design

### 1. Extensibility
- New goal types without schema changes
- Feature-specific data in metadata
- Version field for migrations

### 2. Flexibility
- Various scheduling options
- Different metric types
- Custom rules per goal

### 3. Consistency
- Same API for all goal types
- Unified progress tracking
- Common gamification

### 4. Performance
- Efficient queries by type
- Activity history separate
- Templates for quick creation

### 5. User Experience
- Cross-feature goal dashboard
- Unified notifications
- Comprehensive analytics

## Migration Strategy

To adapt the journaling-specific design:

1. **Extract journaling-specific fields** into metadata
2. **Generalize the core fields** (as shown above)
3. **Create type-specific validators** for metadata
4. **Update API to handle generic goals**
5. **Build UI components** that adapt to goal type

This creates a solid foundation for any lifestyle goal tracking!

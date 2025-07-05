# Enhanced Goal System - FINAL Design

## Overview
After testing against real-world lifestyle goals, we've identified and fixed limitations in our initial design. This enhanced model supports ALL common goal patterns while providing rich data for AI analysis.

## Goal Patterns Supported

### 1. Recurring Goals ✅
"Do X every day/week/month"
- Take 10,000 steps daily
- Journal every evening  
- Workout 3x per week
- Drink 8 glasses of water daily

### 2. Milestone Goals ✅ (NEW)
"Achieve X total"
- Write 50,000 words for NaNoWriMo
- Save $5,000 for vacation
- Complete 100 workouts this year
- Read 1,000,000 words

### 3. Target Goals ✅ (NEW)
"Reach X by date Y"
- Lose 20 pounds by summer
- Run a marathon by October
- Reach 10% body fat by year-end
- Build emergency fund by December

### 4. Streak Goals ✅ (NEW)
"Do X for Y consecutive periods"
- Meditate for 100 days straight
- No alcohol for 30 days
- Write daily for 365 days
- Exercise streak of 50 days

### 5. Limit Goals ✅ (NEW)
"Keep X below Y"
- Screen time under 2 hours/day
- Spend less than $50/week on dining
- Keep calories under 2000/day
- Limit coffee to 2 cups/day

## Enhanced Data Model

```typescript
interface Goal {
  // Identification
  goalId: string;
  userId: string;
  
  // Basic Info
  title: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  
  // Goal Pattern - THE KEY ADDITION
  goalPattern: 'recurring' | 'milestone' | 'target' | 'streak' | 'limit';
  
  // Flexible Target Definition
  target: {
    // What to measure
    metric: 'count' | 'duration' | 'amount' | 'weight' | 'distance' | 'calories' | 'money' | 'custom';
    
    // The goal value
    value: number;
    unit: string;  // steps, words, pounds, dollars, minutes, etc.
    
    // For recurring/limit goals
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    
    // For milestone/target goals  
    targetDate?: Date;
    startValue?: number;      // Starting point (weight, savings, etc.)
    currentValue?: number;    // Latest measurement
    
    // Goal direction
    direction: 'increase' | 'decrease' | 'maintain';
    targetType: 'minimum' | 'maximum' | 'exact' | 'range';
    
    // For ranges
    minValue?: number;
    maxValue?: number;
  };
  
  // Smart Scheduling
  schedule: {
    // When to work on goal
    frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
    daysOfWeek?: number[];
    preferredTimes?: string[];
    
    // When to check progress
    checkInFrequency: 'daily' | 'weekly' | 'monthly';
    
    // Flexibility
    allowSkipDays?: number;   // Can skip X days per period
    catchUpAllowed?: boolean; // Can make up missed days
  };
  
  // Progress Tracking
  progress: {
    // Universal progress
    percentComplete: number;
    lastActivityDate?: Date;
    
    // For recurring goals
    currentPeriodValue?: number;
    periodHistory: {
      period: string;
      achieved: boolean;
      value: number;
    }[];
    
    // For milestone goals
    totalAccumulated?: number;
    remainingToGoal?: number;
    
    // For streak goals
    currentStreak: number;
    longestStreak: number;
    targetStreak?: number;
    
    // For limit goals
    averageValue?: number;
    daysOverLimit?: number;
    
    // Trends
    trend: 'improving' | 'stable' | 'declining';
    projectedCompletion?: Date;
    successRate: number;
  };
  
  // AI-Friendly Context
  context: {
    // Why this goal
    motivation?: string;
    importanceLevel: 1-5;
    
    // Related goals
    supportingGoals?: string[];   // Goals that help this one
    conflictingGoals?: string[];  // Goals that compete
    
    // Personal factors
    obstacles?: string[];
    successFactors?: string[];
    
    // Preferences
    preferredActivities?: string[];
    avoidActivities?: string[];
  };
  
  // Gamification
  rewards: {
    pointsPerActivity: number;
    milestoneRewards: {
      value: number;
      reward: string;
      unlockedAt?: Date;
    }[];
    badges: string[];
  };
  
  // Status
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  visibility: 'private' | 'friends' | 'public';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Feature-specific extensions
  metadata: Record<string, any>;
}
```

## Goal Activity with AI Context

```typescript
interface GoalActivity {
  activityId: string;
  goalId: string;
  userId: string;
  
  // What happened
  value: number;
  unit: string;
  activityType: 'progress' | 'completed' | 'skipped' | 'partial';
  
  // When & Where
  activityDate: Date;
  loggedAt: Date;
  timezone: string;
  location?: {
    type: 'home' | 'work' | 'gym' | 'outdoors' | 'travel';
    city?: string;
    coordinates?: [number, number];
  };
  
  // Rich Context for AI
  context: {
    // Temporal
    timeOfDay: 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: string;
    isWeekend: boolean;
    isHoliday: boolean;
    
    // Environmental
    weather?: {
      condition: string;
      temperature: number;
      humidity: number;
    };
    
    // Physical state
    energyLevel?: 1-10;
    sleepHours?: number;
    stressLevel?: 1-10;
    
    // Social context
    withOthers: boolean;
    socialContext?: 'alone' | 'partner' | 'friends' | 'group' | 'online';
    
    // Activity flow
    previousActivity?: string;
    nextActivity?: string;
    duration?: number;
    
    // Subjective
    difficulty?: 1-5;
    enjoyment?: 1-5;
    mood?: string;
  };
  
  // Evidence
  note?: string;
  attachments?: {
    type: 'image' | 'link' | 'reference';
    url: string;
    entityId?: string;
  }[];
  
  // Integration
  source: 'manual' | 'device' | 'integration' | 'import';
  deviceInfo?: {
    type: string;
    model: string;
    appVersion: string;
  };
}
```

## Real-World Examples

### 1. Daily Steps (Recurring)
```typescript
{
  goalPattern: 'recurring',
  title: "Walk 10,000 steps daily",
  target: {
    metric: 'count',
    value: 10000,
    unit: 'steps',
    period: 'day',
    direction: 'increase',
    targetType: 'minimum'
  }
}
```

### 2. Write a Book (Milestone)
```typescript
{
  goalPattern: 'milestone',
  title: "Complete 80,000 word novel",
  target: {
    metric: 'count',
    value: 80000,
    unit: 'words',
    direction: 'increase',
    currentValue: 15000,
    targetDate: '2024-12-31'
  },
  progress: {
    totalAccumulated: 15000,
    remainingToGoal: 65000,
    percentComplete: 18.75
  }
}
```

### 3. Marathon Training (Target)
```typescript
{
  goalPattern: 'target',
  title: "Run marathon in October",
  target: {
    metric: 'distance',
    value: 26.2,
    unit: 'miles',
    targetDate: '2024-10-15',
    direction: 'increase',
    startValue: 5  // Could run 5 miles when started
  }
}
```

### 4. Meditation Streak (Streak)
```typescript
{
  goalPattern: 'streak',
  title: "100 days of meditation",
  target: {
    metric: 'count',
    value: 1,
    unit: 'session',
    period: 'day',
    direction: 'maintain'
  },
  progress: {
    currentStreak: 47,
    targetStreak: 100,
    longestStreak: 47,
    percentComplete: 47
  }
}
```

### 5. Screen Time Limit (Limit)
```typescript
{
  goalPattern: 'limit',
  title: "Reduce screen time",
  target: {
    metric: 'duration',
    value: 120,
    unit: 'minutes',
    period: 'day',
    direction: 'decrease',
    targetType: 'maximum'
  },
  progress: {
    averageValue: 145,
    daysOverLimit: 3,
    trend: 'improving'
  }
}
```

## AI Analysis Capabilities

### 1. Pattern Recognition
```typescript
interface GoalPatternInsights {
  // Temporal patterns
  bestPerformanceTimes: {
    timeOfDay: string;
    successRate: number;
  }[];
  
  // Environmental patterns
  weatherImpact: {
    condition: string;
    performanceChange: number;
  }[];
  
  // Social patterns
  socialContextPerformance: {
    context: string;
    averageCompletion: number;
  }[];
  
  // Energy patterns
  optimalEnergyLevel: number;
  sleepCorrelation: number;
}
```

### 2. Predictive Analytics
```typescript
interface GoalPredictions {
  // Success predictions
  nextWeekSuccessProbability: number;
  monthlyProjection: number;
  
  // Risk indicators
  abandonmentRisk: 'low' | 'medium' | 'high';
  burnoutRisk: number;
  
  // Recommendations
  suggestedAdjustments: {
    parameter: string;
    currentValue: number;
    suggestedValue: number;
    reasoning: string;
  }[];
}
```

### 3. Cross-Goal Insights
```typescript
interface CrossGoalAnalysis {
  // Correlations
  positiveCorrelations: {
    goal1: string;
    goal2: string;
    correlation: number;
    insight: string;  // "Walking more improves your sleep quality"
  }[];
  
  // Conflicts
  goalConflicts: {
    goal1: string;
    goal2: string;
    conflictType: string;
    suggestion: string;
  }[];
  
  // Optimal schedule
  recommendedSchedule: {
    goalId: string;
    suggestedTime: string;
    reason: string;
  }[];
}
```

## Benefits of This Design

### 1. **Universal Coverage**
- Handles ALL common lifestyle goal types
- Extensible for future patterns
- No need for feature-specific goal systems

### 2. **AI-Ready**
- Rich contextual data for every activity
- Cross-goal correlation opportunities  
- Predictive model training data
- Personalization at scale

### 3. **User Experience**
- Consistent interface across all goals
- Holistic view of lifestyle progress
- Smart recommendations based on patterns
- Meaningful gamification

### 4. **Developer Experience**
- Single API for all goal operations
- Type-safe with TypeScript
- Clear extension points
- Reusable UI components

## Implementation Strategy

### Phase 1: Core + Recurring (Week 1)
- Base goal model
- Recurring goals only
- Basic progress tracking

### Phase 2: Extended Patterns (Week 2)
- Milestone goals
- Target goals
- Limit goals
- Streak goals

### Phase 3: AI Context (Week 3)
- Enhanced activity tracking
- Context collection
- Basic pattern analysis

### Phase 4: Integration (Week 4)
- Connect to feature modules
- Cross-goal analytics
- Predictive insights

This enhanced model provides a rock-solid foundation for the entire AI Lifestyle App ecosystem!

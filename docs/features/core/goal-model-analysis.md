# Goal Model Analysis - Real-World Test Cases

## Current Model Limitations Found

### ✅ Works Well
1. **Take 10,000 steps daily**
   ```typescript
   { metric: "count", value: 10000, unit: "steps", period: "day" }
   ```

2. **Drink 8 glasses of water daily**
   ```typescript
   { metric: "count", value: 8, unit: "glasses", period: "day" }
   ```

3. **Sleep 8 hours per night**
   ```typescript
   { metric: "duration", value: 8, unit: "hours", period: "day" }
   ```

4. **Workout 3x per week**
   ```typescript
   { metric: "count", value: 3, unit: "workouts", period: "week" }
   ```

### ❌ Doesn't Work Well

1. **Write 10,000 words in a book** (Cumulative goal, no reset)
   - Current model assumes periodic reset
   - Need: Milestone/cumulative goals

2. **Lose 20 pounds by summer** (Target with deadline)
   - Current model doesn't support deadlines
   - Need: Target goals with end dates

3. **Run a marathon by June** (Binary achievement)
   - Not a recurring goal
   - Need: One-time achievement goals

4. **Meditate for 100 days straight** (Streak-based)
   - Streak is secondary in current model
   - Need: Streak as primary target

5. **Reduce screen time to 2 hours/day** (Maximum limit)
   - Current model assumes "do more"
   - Need: Limit/reduction goals

6. **Save $5000 for vacation** (Financial accumulation)
   - Cumulative with no time period
   - Need: Savings/accumulation pattern

7. **Read 52 books this year** (Annual goals)
   - "Year" not in our period options
   - Need: Longer period options

## Revised Goal Model

```typescript
interface Goal {
  // ... existing fields ...
  
  // Enhanced Goal Type
  goalPattern: 'recurring' | 'milestone' | 'streak' | 'limit' | 'target';
  
  // Enhanced Target Definition
  target: {
    metric: 'count' | 'duration' | 'amount' | 'boolean' | 'weight' | 'distance';
    value: number;
    unit?: string;
    
    // For recurring goals
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    
    // For milestone/target goals
    targetType?: 'minimum' | 'maximum' | 'exact' | 'range';
    targetDate?: Date;           // By when?
    startValue?: number;         // For reduction goals (current weight)
    
    // For accumulation
    accumulated?: number;        // Current total
    allowNegative?: boolean;     // Can progress go backward?
  };
  
  // Progress Tracking Enhancement
  progress: {
    // ... existing fields ...
    
    // For different goal patterns
    milestoneProgress?: number;  // 5000/10000 words
    streakTarget?: number;       // 100 days goal
    dailyAverage?: number;       // For limit goals
    trend?: 'improving' | 'stable' | 'declining';
    projectedCompletion?: Date;  // AI prediction
  };
}
```

## Examples with Enhanced Model

### 1. Write 10,000 words (Milestone)
```typescript
{
  goalPattern: 'milestone',
  title: "Write my novel",
  target: {
    metric: 'count',
    value: 10000,
    unit: 'words',
    targetType: 'minimum',
    accumulated: 2500  // Current progress
  }
}
```

### 2. Lose 20 pounds by summer (Target)
```typescript
{
  goalPattern: 'target',
  title: "Summer weight goal",
  target: {
    metric: 'weight',
    value: 180,  // Target weight
    unit: 'lbs',
    targetType: 'exact',
    targetDate: '2024-06-01',
    startValue: 200  // Starting weight
  }
}
```

### 3. 100-day meditation streak (Streak)
```typescript
{
  goalPattern: 'streak',
  title: "100 days of meditation",
  target: {
    metric: 'count',
    value: 1,  // Per day
    unit: 'session',
    period: 'day'
  },
  progress: {
    streakTarget: 100,
    currentStreak: 45
  }
}
```

### 4. Limit screen time (Limit)
```typescript
{
  goalPattern: 'limit',
  title: "Reduce screen time",
  target: {
    metric: 'duration',
    value: 120,  // Maximum
    unit: 'minutes',
    period: 'day',
    targetType: 'maximum'
  }
}
```

## AI Analysis Enhancements

### 1. Rich Activity Context
```typescript
interface GoalActivity {
  // ... existing fields ...
  
  // Enhanced context for AI
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: number;
    weather?: string;
    location?: string;
    precedingActivity?: string;    // What did they do before?
    followingActivity?: string;    // What did they do after?
    energyLevel?: 1-10;
    stressLevel?: 1-10;
    companionType?: 'alone' | 'partner' | 'group' | 'virtual';
  };
  
  // Correlations
  correlatedGoals?: string[];      // Other goals affected
  impactedMetrics?: {
    sleep?: number;
    mood?: number;
    productivity?: number;
  };
}
```

### 2. AI-Friendly Aggregations
```typescript
interface GoalAnalytics {
  goalId: string;
  
  // Time patterns
  bestTimeOfDay: string;
  bestDayOfWeek: string;
  seasonalTrends: Record<string, number>;
  
  // Correlations
  positiveCorrelations: {
    goalId: string;
    correlation: number;
    insight: string;  // "You walk more when you journal"
  }[];
  
  // Predictions
  successProbability: number;
  recommendedAdjustments: string[];
  optimalConditions: string[];
  
  // Behavioral insights
  triggers: string[];           // What leads to success
  barriers: string[];           // What prevents success
  sustainabilityScore: number;  // Long-term viability
}
```

## Database Schema Update

```
# Additional access patterns needed:
6. Get all milestone goals with progress
   GSI4PK: USER#123, GSI4SK: MILESTONE#percent_complete

7. Get goals by target date
   GSI5PK: TARGET#2024-06, GSI5SK: date

8. Get limit goals exceeded today
   GSI6PK: LIMIT#2024-01-15, filter: exceeded = true
```

## Benefits for AI Analysis

1. **Pattern Recognition**
   - Time-based patterns (when goals are achieved)
   - Environmental factors (weather, location impact)
   - Social factors (alone vs. with others)

2. **Predictive Insights**
   - Likelihood of achieving milestone goals
   - Optimal times for different activities
   - Early warning for goal abandonment

3. **Personalized Recommendations**
   - "You walk more after morning coffee"
   - "Your reading streak improves on rainy days"
   - "Consider lowering your step goal on Mondays"

4. **Holistic Health View**
   - Cross-goal correlations
   - Impact on sleep, mood, energy
   - Sustainable vs. unsustainable patterns

## Implementation Priority

1. **Phase 1**: Core recurring goals (existing model)
2. **Phase 2**: Milestone and limit goals
3. **Phase 3**: Streak and target goals
4. **Phase 4**: AI context and correlations

This enhanced model handles virtually any lifestyle goal while providing rich data for AI analysis!

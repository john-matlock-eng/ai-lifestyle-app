# Frontend Engineer LLM Instructions - Goal System Integration

## 🚀 Quick Context
The backend team has completed ALL 8 goal endpoints in record time! You need to catch up and build the UI. This guide will help you understand the goal system and integrate quickly.

## 📋 What Backend Built (Complete & Ready)

### Goal Endpoints Available NOW:
1. `GET /goals` - List with filtering, pagination, sorting
2. `POST /goals` - Create goal (5 patterns supported!)
3. `GET /goals/{goalId}` - Get single goal
4. `PUT /goals/{goalId}` - Update goal
5. `DELETE /goals/{goalId}` - Archive goal (soft delete)
6. `POST /goals/{goalId}/activities` - Log activity
7. `GET /goals/{goalId}/activities` - List activities
8. `GET /goals/{goalId}/progress` - Get progress analytics

### The 5 Goal Patterns You Must Support:
1. **recurring** - "Do X every day/week/month" (habits)
2. **milestone** - "Achieve X total" (accumulation)
3. **target** - "Reach X by date Y" (deadline)
4. **streak** - "Do X for Y consecutive days" (chains)
5. **limit** - "Keep X below Y" (restrictions)

## 🎯 Your Mission
Build a goal management UI that makes these 5 patterns intuitive and engaging. Users should be able to create, track, and complete goals with minimal friction.

## 💻 TypeScript Types (Generated from OpenAPI)

```typescript
// Core Goal Types
interface Goal {
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string; // Hex color like #FF5733
  goalPattern: 'recurring' | 'milestone' | 'target' | 'streak' | 'limit';
  target: GoalTarget;
  schedule?: GoalSchedule;
  progress: GoalProgressDetails;
  context?: GoalContext;
  rewards?: GoalRewards;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  visibility: 'private' | 'friends' | 'public';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

interface GoalTarget {
  metric: 'count' | 'duration' | 'amount' | 'weight' | 'distance' | 'calories' | 'money' | 'custom';
  value: number;
  unit: string; // "steps", "minutes", "pounds", etc.
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year'; // For recurring/limit
  targetDate?: string; // For milestone/target
  startValue?: number;
  currentValue?: number;
  direction: 'increase' | 'decrease' | 'maintain';
  targetType: 'minimum' | 'maximum' | 'exact' | 'range';
  minValue?: number; // For range
  maxValue?: number; // For range
}

interface GoalProgressDetails {
  percentComplete: number; // 0-100
  lastActivityDate?: string;
  currentPeriodValue?: number; // For recurring
  totalAccumulated?: number; // For milestone
  remainingToGoal?: number;
  currentStreak?: number;
  longestStreak?: number;
  averageValue?: number; // For limits
  daysOverLimit?: number;
  trend: 'improving' | 'stable' | 'declining';
  projectedCompletion?: string;
  successRate: number; // 0-100
  periodHistory?: PeriodHistory[];
}

interface ActivityContext {
  timeOfDay?: 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'night';
  energyLevel?: number; // 1-10
  enjoyment?: number; // 1-5
  mood?: string;
  weather?: {
    condition?: string;
    temperature?: number;
  };
  withOthers?: boolean;
  duration?: number; // minutes
  difficulty?: number; // 1-5
}

// Request Types
interface CreateGoalRequest {
  title: string;
  description?: string;
  category: string;
  goalPattern: Goal['goalPattern'];
  target: GoalTarget;
  schedule?: GoalSchedule;
  context?: GoalContext;
}

interface LogActivityRequest {
  value: number;
  unit: string;
  activityType: 'progress' | 'completed' | 'skipped' | 'partial';
  activityDate?: string; // Defaults to today
  context?: ActivityContext;
  note?: string;
}
```

## 🎨 UI Components You Need to Build

### 1. Goal Pattern Selector (Critical!)
```tsx
// PatternSelector.tsx
const patterns = [
  {
    id: 'recurring',
    icon: '🔄',
    title: 'Build a Habit',
    description: 'Do something regularly',
    examples: ['Exercise daily', 'Read 30 min/day', 'Meditate'],
    color: '#3B82F6' // blue
  },
  {
    id: 'milestone',
    icon: '🎯',
    title: 'Reach a Total',
    description: 'Accumulate over time',
    examples: ['Read 50 books', 'Save $5000', 'Run 500 miles'],
    color: '#8B5CF6' // purple
  },
  {
    id: 'target',
    icon: '🏁',
    title: 'Hit a Target',
    description: 'Achieve by deadline',
    examples: ['Lose 20 lbs by June', 'Finish project', 'Learn Spanish'],
    color: '#10B981' // green
  },
  {
    id: 'streak',
    icon: '🔥',
    title: 'Build a Streak',
    description: 'Consecutive days',
    examples: ['100 day streak', 'No smoking 30 days', 'Daily commits'],
    color: '#F59E0B' // orange
  },
  {
    id: 'limit',
    icon: '🛑',
    title: 'Set a Limit',
    description: 'Stay under threshold',
    examples: ['< 2000 calories/day', 'Max 2 hours TV', '< $50/week eating out'],
    color: '#EF4444' // red
  }
];
```

### 2. Goal Creation Wizard
```tsx
// GoalWizard.tsx - Multi-step form
const steps = [
  'SelectPattern',      // Which of the 5 patterns?
  'BasicInfo',         // Title, category, description
  'SetTarget',         // Pattern-specific target config
  'Schedule',          // When/how often (if applicable)
  'Motivation',        // Why this matters, obstacles
  'Review'            // Confirm before creating
];

// Pattern-specific target configuration
const TargetConfigs = {
  recurring: () => (
    <>
      <NumberInput label="Target Value" placeholder="10000" />
      <Select label="Unit" options={['steps', 'minutes', 'pages', 'custom']} />
      <Select label="Period" options={['day', 'week', 'month']} />
    </>
  ),
  milestone: () => (
    <>
      <NumberInput label="Total Goal" placeholder="50" />
      <Select label="Unit" options={['books', 'pounds', 'miles', 'custom']} />
      <DatePicker label="Target Date (optional)" />
    </>
  ),
  // ... etc for other patterns
};
```

### 3. Goal Cards (List View)
```tsx
// GoalCard.tsx
<Card className={`border-l-4 border-${patternColors[goal.goalPattern]}`}>
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{patternIcons[goal.goalPattern]}</span>
        <h3 className="font-semibold">{goal.title}</h3>
        <Badge>{goal.category}</Badge>
      </div>
      
      {/* Pattern-specific progress display */}
      {renderProgressByPattern(goal)}
      
      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
        <span>{goal.progress.successRate}% success</span>
        <span>{goal.progress.trend} trend</span>
      </div>
    </div>
    
    <QuickLogButton goalId={goal.goalId} />
  </div>
</Card>

// Pattern-specific progress renderers
const renderProgressByPattern = (goal: Goal) => {
  switch(goal.goalPattern) {
    case 'recurring':
      return <RecurringProgress current={goal.progress.currentPeriodValue} target={goal.target.value} />;
    case 'streak':
      return <StreakDisplay current={goal.progress.currentStreak} longest={goal.progress.longestStreak} />;
    case 'milestone':
      return <ProgressBar value={goal.progress.percentComplete} label={`${goal.progress.totalAccumulated}/${goal.target.value}`} />;
    // ... etc
  }
};
```

### 4. Quick Activity Logger
```tsx
// QuickLog.tsx - Optimized for speed
const QuickLog = ({ goalId }: { goalId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logActivity } = useGoals();
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost">
          <Plus className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      
      <SheetContent>
        <form onSubmit={handleSubmit}>
          {/* Smart defaults based on goal type */}
          <NumberInput 
            label="Value"
            defaultValue={getSmartDefault(goal)}
            autoFocus
          />
          
          {/* Optional context - collapsed by default */}
          <Collapsible>
            <CollapsibleTrigger>Add context</CollapsibleTrigger>
            <CollapsibleContent>
              <MoodPicker />
              <EnergySlider />
              <Textarea placeholder="Quick note..." />
            </CollapsibleContent>
          </Collapsible>
          
          <Button type="submit" className="w-full">
            Log Activity
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
```

### 5. Progress Visualizations
```tsx
// ProgressVisualizations.tsx
const visualizations = {
  recurring: CalendarHeatmap,     // GitHub-style contribution graph
  milestone: ProgressChart,       // Line chart with projection
  target: CountdownTimer,         // Days remaining + trajectory
  streak: StreakFlame,           // Animated flame with day count
  limit: GaugeChart              // Speedometer-style gauge
};

// Example: Streak Flame Component
const StreakFlame = ({ days, isActive }: { days: number; isActive: boolean }) => (
  <div className="relative">
    <motion.div
      animate={{ 
        scale: isActive ? [1, 1.1, 1] : 1,
        opacity: isActive ? 1 : 0.5 
      }}
      transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
    >
      <Flame className="w-12 h-12 text-orange-500" />
    </motion.div>
    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-bold">
      {days}
    </span>
  </div>
);
```

## 🏃‍♂️ Catch-Up Action Plan

### Day 1 (Monday) - Foundation
1. **Morning**: Complete 2FA UI (2 hours max)
2. **Late Morning**: Study the goal types and API responses
3. **Afternoon**: Build PatternSelector component
4. **End of Day**: Basic GoalCard component

### Day 2 (Tuesday) - Creation Flow
1. **Morning**: Goal creation wizard (multi-step)
2. **Afternoon**: Pattern-specific target configurations
3. **End of Day**: Test creating all 5 goal types

### Day 3 (Wednesday) - Display & Interaction
1. **Morning**: Goal list with filtering/sorting
2. **Afternoon**: Quick activity logger
3. **End of Day**: Basic progress displays

### Day 4 (Thursday) - Progress & Polish
1. **Morning**: Progress visualizations by pattern
2. **Afternoon**: Goal detail page
3. **End of Day**: Mobile responsive testing

### Day 5 (Friday) - Integration & Testing
1. **Morning**: Error handling and edge cases
2. **Afternoon**: Performance optimization
3. **End of Day**: Demo preparation

## 🔥 Pro Tips for Speed

### 1. Use Zustand for State
```typescript
// stores/goals.ts
interface GoalStore {
  goals: Goal[];
  loading: boolean;
  
  // Actions
  fetchGoals: () => Promise<void>;
  createGoal: (data: CreateGoalRequest) => Promise<Goal>;
  logActivity: (goalId: string, data: LogActivityRequest) => Promise<void>;
  
  // Optimistic updates
  optimisticUpdate: (goalId: string, update: Partial<Goal>) => void;
}
```

### 2. Optimistic UI Updates
```typescript
const logActivity = async (goalId: string, value: number) => {
  // Update UI immediately
  optimisticUpdate(goalId, {
    progress: {
      ...goal.progress,
      currentPeriodValue: value,
      lastActivityDate: new Date().toISOString()
    }
  });
  
  try {
    await api.logActivity(goalId, { value, unit: goal.target.unit });
  } catch (error) {
    // Rollback on failure
    rollbackUpdate(goalId);
    toast.error('Failed to log activity');
  }
};
```

### 3. Reusable Components
```typescript
// Build these once, use everywhere
<ProgressRing value={percentComplete} size="sm" />
<TrendIndicator trend={goal.progress.trend} />
<SuccessRate rate={goal.progress.successRate} />
<QuickLogButton goalId={goalId} />
<GoalBadge pattern={goal.goalPattern} />
```

### 4. Smart Defaults
```typescript
const getDefaultsByPattern = (pattern: GoalPattern) => {
  const defaults = {
    recurring: { period: 'day', targetType: 'minimum' },
    milestone: { targetType: 'exact', direction: 'increase' },
    target: { targetType: 'exact', direction: 'increase' },
    streak: { targetType: 'minimum', period: 'day' },
    limit: { targetType: 'maximum', period: 'day' }
  };
  return defaults[pattern];
};
```

## 🚨 Common Pitfalls to Avoid

1. **Don't overcomplicate the UI** - Start simple, add features gradually
2. **Pattern confusion** - Make it crystal clear which pattern does what
3. **Forgetting timezones** - Always send dates in user's timezone
4. **Ignoring loading states** - Every action needs feedback
5. **Mobile experience** - Test on phone constantly

## 📱 Mobile-First Considerations

```typescript
// Mobile-optimized quick actions
<div className="fixed bottom-20 right-4 z-50 md:hidden">
  <Fab onClick={() => setQuickLogOpen(true)}>
    <Plus />
  </Fab>
</div>

// Swipe gestures for activity logging
<SwipeableCard
  onSwipeRight={() => logActivity('completed')}
  onSwipeLeft={() => logActivity('skipped')}
>
  <GoalCard goal={goal} />
</SwipeableCard>
```

## 🎯 Success Metrics

Your UI is successful when:
1. Users can create a goal in < 30 seconds
2. Logging an activity takes < 5 seconds
3. Progress is visible at a glance
4. The right pattern is obvious from examples
5. Mobile experience is as good as desktop

## 🆘 When You're Stuck

1. **Check the contract**: `/contract/openapi.yaml`
2. **Look at backend implementation**: `/backend/handlers/goals/`
3. **Ask about patterns**: Each has specific business rules
4. **Test with real data**: Create goals of each type
5. **User perspective**: Would your mom understand this?

## 🎨 Design Inspiration

- **Habitica**: Gamification and streaks
- **Strava**: Activity tracking and progress
- **Duolingo**: Streak visualization
- **GitHub**: Contribution graphs
- **Apple Fitness**: Ring closures

Remember: The backend is ready and waiting. Your job is to make this powerful system accessible and delightful for users. You've got this! 🚀

---
**Last Updated**: 2025-01-05 by PM Agent
**Backend Status**: COMPLETE ✅
**Your Status**: Time to catch up! 💪
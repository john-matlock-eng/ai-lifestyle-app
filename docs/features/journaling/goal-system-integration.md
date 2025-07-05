# Journaling Feature - Updated Architecture

## Important Update: Generic Goal System

**Note**: The journaling feature will now use the [Generic Goal System](../core/goal-system-design.md) rather than a journaling-specific goal model. This ensures consistency across all lifestyle features.

## How Journaling Uses the Generic Goal System

### 1. Goal Creation
```typescript
// Creating a journaling goal using the generic system
const journalingGoal: Goal = {
  goalId: "GOAL#" + uuid(),
  userId: currentUser.id,
  goalType: "journal",
  
  title: "Daily Gratitude Practice",
  description: "Write three things I'm grateful for each day",
  category: "gratitude",
  icon: "📓",
  color: "#8B5CF6",
  
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
  
  // Journaling-specific data goes in metadata
  metadata: {
    prompts: [
      {
        promptId: "prompt#1",
        text: "What are three things you're grateful for today?",
        order: 1,
        optional: false
      }
    ],
    useAiPrompts: true,
    preferredTopics: ["gratitude", "personal-growth"],
    privacyLevel: "private"
  }
};
```

### 2. Goal Activity Tracking
```typescript
// When user creates a journal entry
const activity: GoalActivity = {
  activityId: "ACTIVITY#" + uuid(),
  goalId: journalingGoal.goalId,
  userId: currentUser.id,
  
  activityType: "completed",
  value: 1,
  unit: "entry",
  
  activityDate: new Date(),
  loggedAt: new Date(),
  
  // Link to the actual journal entry
  attachments: [{
    type: "reference",
    url: `/journal/entries/${entryId}`,
    entityId: entryId
  }],
  
  mood: "good",
  note: "Felt really grateful today",
  
  source: "manual"
};
```

### 3. Integration Points

#### Journal Entry Creation
When a user creates a journal entry:
1. Save the journal entry as normal
2. Check if entry satisfies any active journaling goals
3. Create GoalActivity record(s) for completed goals
4. Update goal progress and streaks

#### Goal-Driven Prompts
When user opens journal with an active goal:
1. Fetch active journaling goals
2. Extract prompts from goal metadata
3. Display prompts in editor
4. Track which goal prompted the entry

#### Analytics Integration
The generic goal system provides:
- Streak tracking across all lifestyle goals
- Unified progress dashboard
- Cross-feature insights (e.g., correlation between journaling and mood)

## API Updates

### Journaling-Specific Endpoints
```yaml
# Journal entries remain the same
POST   /journal/entries
GET    /journal/entries
PUT    /journal/entries/{id}
DELETE /journal/entries/{id}

# Goal-related operations now use generic endpoints
POST   /goals                    # Create journaling goal
GET    /goals?type=journal       # Get journaling goals
POST   /goals/{id}/checkin       # Mark journal entry complete
```

### Creating a Journaling Goal via API
```bash
POST /goals
{
  "goalType": "journal",
  "title": "Morning Pages",
  "target": {
    "metric": "count",
    "value": 1,
    "unit": "entry",
    "period": "day"
  },
  "schedule": {
    "frequency": "daily",
    "preferredTimes": ["06:00"]
  },
  "metadata": {
    "prompts": [{
      "text": "What's on your mind this morning?",
      "order": 1
    }],
    "minimumWords": 750
  }
}
```

## UI Components Update

### Goal Creation Flow
```typescript
// Reusable goal creation wizard
<GoalCreationWizard
  goalType="journal"
  onComplete={(goal) => {
    // Handle journal-specific setup
    if (goal.metadata.useAiPrompts) {
      generateAiPrompts(goal);
    }
  }}
>
  {/* Journal-specific form fields */}
  <JournalGoalFields />
</GoalCreationWizard>
```

### Progress Display
```typescript
// Generic goal progress component
<GoalProgress
  goal={journalingGoal}
  renderCustomMetrics={(goal) => {
    if (goal.goalType === 'journal') {
      return <WordCountStats entries={goal.metadata.totalWords} />;
    }
  }}
/>
```

## Benefits of Using Generic System

### 1. Unified Experience
- Users see journaling goals alongside fitness, nutrition goals
- Single notification system for all reminders
- Consistent progress tracking UI

### 2. Cross-Feature Insights
- "You journal more on days you exercise"
- "Your mood improves with consistent journaling"
- "You meet more goals when you start with journaling"

### 3. Simplified Development
- Reuse goal CRUD operations
- Share reminder infrastructure
- Common analytics pipeline

### 4. Future Features
- Goal templates marketplace
- Social goal challenges
- AI-powered goal recommendations
- Coaching integrations

## Migration Notes

For the initial implementation:
1. Build the generic goal system first
2. Implement journaling as the first use case
3. Validate the extension pattern works well
4. Document patterns for other features

## Summary

By using the generic goal system, journaling becomes part of a holistic wellness platform rather than a standalone feature. Users can set and track journaling goals alongside all their other lifestyle goals, creating a more engaging and effective wellness journey.

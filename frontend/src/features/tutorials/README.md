# Tutorial Onboarding System

## Overview

The tutorial onboarding system provides an extensible, companion-integrated way to guide users through the AI Lifestyle App. It features:

- **Companion Integration**: The shih tzu companion provides contextual guidance and encouragement
- **Extensible Design**: Easy to add new tutorial steps with minimal maintenance
- **User Control**: Users can opt-out completely or skip individual tutorials
- **Progress Tracking**: Tracks completed and skipped steps in user profile
- **Auto-progression**: Configurable timeouts for certain tutorials (e.g., encryption setup)

## Architecture

### Backend Integration

The user profile now includes tutorial preferences:

```python
class TutorialPreferences(BaseModel):
    enabled: bool = True
    completedSteps: List[TutorialStep] = []
    skippedSteps: List[TutorialStep] = []
    lastShownStep: Optional[TutorialStep] = None
    lastShownAt: Optional[datetime] = None
```

Tutorial steps are defined as an enum for type safety:

```python
class TutorialStep(str, Enum):
    DASHBOARD_INTRO = "dashboard_intro"
    ENCRYPTION_SETUP = "encryption_setup"
    HABIT_CREATION = "habit_creation"
    # ... more steps
```

### Frontend Components

1. **`useTutorialManager` Hook**: Core logic for tutorial management
   - Handles state management
   - API updates to user profile
   - Progress tracking
   - Step sequencing

2. **`CompanionTutorial` Component**: UI integration with companion
   - Shows tutorial UI panels
   - Manages companion reactions
   - Handles element highlighting
   - Auto-progression timers

3. **`TutorialSettings` Component**: User preferences UI
   - Enable/disable tutorials
   - View progress
   - Reset progress

## Tutorial Flow

### Initial User Journey

1. **Registration Success** → User lands on `/register/success`
2. **First Sign In** → User signs in and lands on `/dashboard`
3. **Encryption Prompt** (30s timeout)
   - If user sets up encryption → Move to dashboard intro
   - If timeout → Skip to dashboard intro
4. **Dashboard Introduction** → Overview of dashboard features
5. **Habit Creation** → Encourage creating first habit
6. **Feature Tours** → As user navigates, show relevant tutorials

### Adding New Tutorials

1. **Backend**: Add to `TutorialStep` enum in `models.py`
2. **Frontend**: Add to `config.ts`:

```typescript
TUTORIAL_STEPS: {
  new_feature: {
    id: "new_feature",
    name: "New Feature Introduction",
    description: "Learn about this awesome feature",
    companionThoughts: {
      intro: "Let me show you something cool! 🎉",
      success: "You're a natural! 🌟",
      skip: "No worries, explore at your own pace 👍"
    },
    duration: 5000,
    requiresAction: true,
    targetElement: ".new-feature-button",
    placement: "below"
  }
}
```

3. Add to `TUTORIAL_FLOW` array to set sequencing
4. Map to pages in `useTutorialManager.checkPageTutorials()`

## Companion Integration

The companion provides contextual feedback:

- **Moods**: Changes based on tutorial context (curious, protective, happy)
- **Positioning**: Moves near highlighted elements
- **Thoughts**: Shows encouraging messages
- **Particles**: Celebrates completions with visual effects

### Encryption Tutorial Special Handling

- 30-second auto-progress timer
- Companion shows "protective" mood
- Encourages security setup
- Gracefully handles skip/timeout

## User Settings

Users can:
- Toggle tutorials on/off globally
- Skip individual tutorials
- Reset progress to see tutorials again
- View completion statistics

Settings are persisted in user profile and sync across devices.

## Usage Example

```tsx
// In any page component
const DashboardPage = () => {
  const companion = useEnhancedAuthShihTzu();
  
  return (
    <div>
      {/* Page content */}
      
      {/* Add tutorial system */}
      <CompanionTutorial 
        companion={companion} 
        pageId="dashboard" 
      />
    </div>
  );
};
```

## Best Practices

1. **Keep tutorials short**: 3-5 seconds for info, actions as needed
2. **Make them skippable**: Users should always have control
3. **Contextual timing**: Show tutorials when features are relevant
4. **Clear value**: Each tutorial should provide obvious benefit
5. **Personality**: Let the companion's personality shine through

## Future Enhancements

- Analytics on tutorial completion rates
- A/B testing different tutorial flows
- Conditional tutorials based on user behavior
- Multi-language support for tutorial content
- Tutorial replay from help menu

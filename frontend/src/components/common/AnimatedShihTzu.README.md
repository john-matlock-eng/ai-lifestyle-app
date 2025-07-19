# AnimatedShihTzu Component

A delightful animated white Shih Tzu companion for your AI Lifestyle App. This component adds an interactive pet that responds to user actions and app events.

## Features

- **5 Mood States**: idle, happy, sleeping, curious, walking
- **Smooth Movement**: Click anywhere to move the companion
- **Interactive**: Click the dog to cycle through moods
- **Responsive**: Different sizes (sm, md, lg)
- **Context-Aware**: Reacts to app events (goals, journaling, tips)

## Basic Usage

```tsx
import { AnimatedShihTzu } from '@/components/common';

function MyComponent() {
  const [mood, setMood] = useState('idle');
  const [position, setPosition] = useState({ x: 100, y: 100 });

  return (
    <AnimatedShihTzu
      mood={mood}
      position={position}
      onPositionChange={setPosition}
    />
  );
}
```

## Using the Companion Hook

The `useShihTzuCompanion` hook provides a complete state management solution:

```tsx
import { useShihTzuCompanion } from '@/hooks/useShihTzuCompanion';

function MyApp() {
  const {
    mood,
    position,
    celebrate,
    showCuriosity,
    startJournaling,
    moveToElement,
  } = useShihTzuCompanion();

  // Celebrate when a goal is completed
  const onGoalComplete = () => {
    celebrate();
    // Your goal logic...
  };

  // Move to journaling area when journaling starts
  const onJournalStart = () => {
    startJournaling();
    // Your journal logic...
  };

  return (
    <div>
      {/* Your app content */}
      <AnimatedShihTzu mood={mood} position={position} />
    </div>
  );
}
```

## Integration Examples

### With Goal Tracking

```tsx
// In your goal completion handler
const handleGoalComplete = async (goalId: string) => {
  // Complete the goal
  await completeGoal(goalId);
  
  // Celebrate with the companion
  shihTzuCompanion.celebrate();
  
  // Move companion to the completed goal element
  const goalElement = document.getElementById(`goal-${goalId}`);
  if (goalElement) {
    shihTzuCompanion.moveToElement(goalElement);
  }
};
```

### With Journaling

```tsx
// In your journal component
const JournalEntry = () => {
  const { startJournaling } = useShihTzuCompanion();
  
  useEffect(() => {
    // When journal opens, companion curls up in corner
    startJournaling();
  }, []);

  return (
    <div className="journal-container">
      {/* Journal content */}
    </div>
  );
};
```

### With Onboarding/Tips

```tsx
// Show curiosity when displaying tips
const showTip = (tip: string) => {
  shihTzuCompanion.showCuriosity();
  // Display your tip UI
};
```

### With Habit Streaks

```tsx
// Special celebration for streaks
const handleStreakMilestone = (days: number) => {
  // Move to center of screen
  shihTzuCompanion.setPosition({
    x: window.innerWidth / 2 - 40,
    y: window.innerHeight / 2 - 40
  });
  
  // Extended celebration
  shihTzuCompanion.celebrate();
};
```

## Props

### AnimatedShihTzu Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| mood | `'idle' \| 'happy' \| 'sleeping' \| 'curious' \| 'walking'` | `'idle'` | Current mood/animation state |
| position | `{ x: number; y: number }` | `{ x: 100, y: 100 }` | Position on screen |
| onPositionChange | `(position: { x: number; y: number }) => void` | - | Callback when position changes |
| onClick | `() => void` | - | Custom click handler (defaults to mood cycling) |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the companion |
| className | `string` | - | Additional CSS classes |

### useShihTzuCompanion Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| initialMood | `mood` | `'idle'` | Starting mood |
| initialPosition | `{ x: number; y: number }` | `{ x: 100, y: 100 }` | Starting position |
| idleTimeout | `number` | `30000` | Time before auto-idle (ms) |

## Mood Descriptions

- **idle**: Default state, gentle breathing
- **happy**: Bouncing with tail wagging and sparkles
- **sleeping**: Eyes closed, breathing animation, Z's floating
- **curious**: Head tilted with raised eyebrows and question mark
- **walking**: Leg movement animation

## Styling

The component uses Tailwind CSS and includes all animations inline. You can customize appearance with the `className` prop:

```tsx
<AnimatedShihTzu
  className="drop-shadow-lg"
  size="lg"
  mood={mood}
  position={position}
/>
```

## Best Practices

1. **Performance**: Limit the frequency of position updates to avoid janky animations
2. **Accessibility**: The companion is decorative, ensure important actions don't rely solely on it
3. **Mobile**: Consider smaller size on mobile devices
4. **User Preference**: Allow users to hide/show the companion in settings

## Future Enhancements

- Sound effects (barks, snores, happy sounds)
- More moods (excited, sad, playful)
- Customizable colors/breeds
- Save favorite positions
- AI-driven autonomous behavior
- Interaction with other UI elements

## Example Implementation

See `ShihTzuCompanionExample.tsx` for a complete working example of integration.

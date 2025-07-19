# Quick Integration Guide for AnimatedShihTzu

## 1. Import the Component and Hook

```tsx
import { AnimatedShihTzu } from '@/components/common';
import { useShihTzuCompanion } from '@/hooks';
```

## 2. Add to Your Main App Layout

In your main App.tsx or Layout component:

```tsx
function App() {
  const shihTzuCompanion = useShihTzuCompanion();

  // Make companion globally accessible
  useEffect(() => {
    window.shihTzuCompanion = shihTzuCompanion;
  }, [shihTzuCompanion]);

  return (
    <div className="relative">
      {/* Your existing app content */}
      <Routes>...</Routes>
      
      {/* Add the companion - it will appear on all pages */}
      <AnimatedShihTzu
        mood={shihTzuCompanion.mood}
        position={shihTzuCompanion.position}
        onPositionChange={shihTzuCompanion.setPosition}
      />
    </div>
  );
}
```

## 3. Integrate with Existing Features

### Goals/Habits Page
```tsx
// In your goal completion handler
const completeGoal = async (goalId: string) => {
  await api.completeGoal(goalId);
  window.shihTzuCompanion?.celebrate();
};
```

### Journal Page
```tsx
// When journal page mounts
useEffect(() => {
  window.shihTzuCompanion?.startJournaling();
  return () => {
    window.shihTzuCompanion?.setMood('idle');
  };
}, []);
```

### Dashboard
```tsx
// Show curiosity for tips/insights
const showInsight = () => {
  window.shihTzuCompanion?.showCuriosity();
  // Show your insight UI
};
```

## 4. Add User Settings (Optional)

```tsx
// In your settings/preferences
const [showCompanion, setShowCompanion] = useState(true);

// Conditionally render
{showCompanion && (
  <AnimatedShihTzu {...companionProps} />
)}
```

## 5. TypeScript Support

Add to your global types:

```tsx
// In types/global.d.ts
import { UseShihTzuCompanionReturn } from '@/hooks/useShihTzuCompanion';

declare global {
  interface Window {
    shihTzuCompanion?: UseShihTzuCompanionReturn;
  }
}
```

That's it! Your app now has an interactive Shih Tzu companion! 🐕

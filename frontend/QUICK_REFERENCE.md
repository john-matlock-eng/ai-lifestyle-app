# Frontend Quick Reference

## Essential Imports Cheat Sheet

### Types (Always use these, never redefine locally!)
```typescript
import { JournalEntry, GoalProgress, CreateJournalEntryRequest } from '@/types/journal';
import { Goal, CreateGoalRequest } from '@/types/goals';
import { Meal, FoodItem } from '@/types/meals';
import { Workout, Exercise } from '@/types/workouts';
```

### Common Components
```typescript
import { Button, Input } from '@/components/common';
import { LoadingScreen } from '@/components/common';
```

### API Functions
```typescript
// Journal
import { getEntry, listEntries, createEntry, updateEntry, deleteEntry } from '@/api/journal';

// Goals
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/api/goals';

// Auth
import { login, logout, register, getCurrentUser } from '@/api/auth';
```

### Hooks
```typescript
import { useAuth } from '@/hooks/useAuth';
import { useEncryption } from '@/contexts/useEncryption';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
```

### Journal Utilities
```typescript
import { getTemplateIcon, getTemplateName } from '../templates/template-utils';
import { getEmotionById, getEmotionEmoji } from '../components/EmotionSelector/emotionData';
import { shouldTreatAsEncrypted } from '@/utils/encryption-utils';
import { getEncryptionService } from '@/services/encryption';
```

## Common Patterns

### React Query Pattern
```typescript
// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', 'identifier'],
  queryFn: () => apiFunction(params),
  enabled: !!requiredParam
});

// Mutation
const mutation = useMutation({
  mutationFn: apiFunction,
  onSuccess: (data) => {
    // Handle success
    queryClient.invalidateQueries(['resource']);
  }
});
```

### Error Handling Pattern
```typescript
if (isLoading) return <LoadingScreen />;
if (error) return <ErrorComponent message={error.message} />;
if (!data) return <EmptyState />;
```

### Glass Morphism Styling
```typescript
// Containers
className="glass rounded-2xl p-8"
className="glass-hover rounded-xl p-6 cursor-pointer"

// Surfaces
className="bg-surface rounded-lg p-4"
className="bg-surface-muted"

// Text
className="text-theme"      // Primary text
className="text-muted"      // Secondary text
className="text-accent"     // Accent color
```

## TypeScript Tips

### Type Guards
```typescript
// Check if entry is encrypted
if (entry.isEncrypted && entry.encryptedKey) {
  // TypeScript knows these fields exist
}

// Check optional fields
if (entry.mood) {
  const moodDisplay = getMoodDisplay(entry.mood);
}
```

### Type Assertions (use sparingly!)
```typescript
// Only when absolutely necessary
const template = entry.template as JournalTemplate;

// Prefer type narrowing
if (isJournalTemplate(entry.template)) {
  // template is now typed correctly
}
```

## Common Mistakes to Avoid

### ❌ Don't Do This
```typescript
// Don't redefine types
interface JournalEntry {
  id: string;
  // ...
}

// Don't use any
const handleSubmit = (data: any) => {
  // ...
}

// Don't import from deep paths
import Button from '@/components/common/Button/Button.tsx';

// Don't use window.location for navigation
window.location.href = '/journal';
```

### ✅ Do This Instead
```typescript
// Import types
import { JournalEntry } from '@/types/journal';

// Use proper types
const handleSubmit = (data: CreateJournalEntryRequest) => {
  // ...
}

// Import from index
import { Button } from '@/components/common';

// Use React Router
const navigate = useNavigate();
navigate('/journal');
```

## Debugging Commands

```bash
# Type checking
npm run type-check

# Find type errors
npx tsc --noEmit

# Check for unused imports
npm run lint

# Bundle analysis
npm run build -- --analyze
```

## Environment Variables
```bash
VITE_API_URL=http://localhost:8000/api
VITE_APP_VERSION=1.0.0
VITE_SENTRY_DSN=your-sentry-dsn
```

## Quick Component Template
```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/common';
import { ResourceType } from '@/types/resource';
import { getResource } from '@/api/resource';

interface ComponentProps {
  id: string;
}

export const Component: React.FC<ComponentProps> = ({ id }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => getResource(id),
    enabled: !!id
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>Not found</div>;

  return (
    <div className="glass rounded-2xl p-8">
      {/* Component content */}
    </div>
  );
};
```

## CSS Classes Reference
```css
/* Layout */
.container
.min-h-screen
.max-w-4xl
.mx-auto

/* Spacing */
.p-4, .p-6, .p-8
.m-2, .m-4, .m-6
.gap-2, .gap-4, .gap-6

/* Glass Effect */
.glass
.glass-hover
.backdrop-blur-sm
.backdrop-blur-md

/* Colors */
.bg-background
.bg-surface
.bg-surface-muted
.text-theme
.text-muted
.text-accent
.text-error
.text-success

/* Common Flex */
.flex
.flex-col
.items-center
.justify-between
.justify-center

/* Grid */
.grid
.grid-cols-1
.md:grid-cols-2
.lg:grid-cols-3
```

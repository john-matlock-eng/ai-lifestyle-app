# TypeScript Type System Guide

## Overview
This guide explains the TypeScript type system used in the AI Lifestyle App to prevent type-related issues during development.

## Core Principles

### 1. Single Source of Truth
All types are defined once in `src/types/` and imported everywhere else.

```typescript
// ✅ CORRECT
import { JournalEntry } from '@/types/journal';

// ❌ WRONG - Never redefine types locally
interface JournalEntry {
  // Don't do this!
}
```

### 2. Type File Organization
```
src/types/
├── auth.ts        # Authentication types
├── journal.ts     # Journal feature types
├── goals.ts       # Goals feature types
├── meals.ts       # Meals feature types
├── workouts.ts    # Workouts feature types
├── encryption.ts  # Encryption types
├── api.ts         # Generic API types
└── index.ts       # Common exports
```

## Journal Types Deep Dive

### Core Types
```typescript
// Journal Template Enum
export const JournalTemplate = {
  DAILY_REFLECTION: "daily_reflection",
  GRATITUDE: "gratitude",
  GOAL_PROGRESS: "goal_progress",
  MOOD_TRACKER: "mood_tracker",
  HABIT_TRACKER: "habit_tracker",
  CREATIVE_WRITING: "creative_writing",
  BLANK: "blank"
} as const;

export type JournalTemplate = typeof JournalTemplate[keyof typeof JournalTemplate];

// Goal Progress (Note: progressValue is number!)
export interface GoalProgress {
  goalId: string;
  progressValue?: number;  // ← This is a NUMBER, not string!
  notes?: string;
  completed: boolean;
}

// Main Journal Entry
export interface JournalEntry {
  entryId: string;
  userId: string;
  title: string;
  content: string;
  template: JournalTemplate;
  wordCount: number;
  tags: string[];
  mood?: string;
  linkedGoalIds: string[];
  goalProgress: GoalProgress[];  // Array of GoalProgress
  createdAt: string;  // ISO string
  updatedAt: string;  // ISO string
  isEncrypted: boolean;
  isShared: boolean;
  encryptedKey?: string;
  encryptionIv?: string;
  sharedWith: string[];
}
```

### Request/Response Types
```typescript
// Creating a journal entry
export interface CreateJournalEntryRequest {
  title: string;
  content: string;
  template?: JournalTemplate;
  wordCount?: number;
  tags?: string[];
  mood?: string;
  linkedGoalIds?: string[];
  goalProgress?: GoalProgress[];
  isEncrypted: boolean;
  encryptedKey?: string;
  encryptionIv?: string;
  isShared?: boolean;
}

// List response
export interface JournalListResponse {
  entries: JournalEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

## Common Type Patterns

### Optional Properties
```typescript
// Use ? for optional properties
interface Example {
  required: string;
  optional?: string;  // May be undefined
}

// Check before use
if (entry.mood) {
  // mood is defined here
}
```

### Union Types
```typescript
// For fixed sets of values
type ReadingMode = 'light' | 'dark' | 'sepia';
type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

// For success/error states
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

### Generic Types
```typescript
// API Response wrapper
interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

// Usage
const response: ApiResponse<JournalEntry> = await api.get(...);
```

## Type Guards and Narrowing

### Type Guards
```typescript
// Check if value is of specific type
function isJournalTemplate(value: string): value is JournalTemplate {
  return Object.values(JournalTemplate).includes(value as JournalTemplate);
}

// Usage
if (isJournalTemplate(template)) {
  // template is JournalTemplate here
}
```

### Discriminated Unions
```typescript
type JournalContent = 
  | { type: 'text'; content: string }
  | { type: 'structured'; data: Record<string, any> }
  | { type: 'encrypted'; encryptedData: string; key: string };

// Type narrowing
switch (content.type) {
  case 'text':
    // content.content is available
    break;
  case 'structured':
    // content.data is available
    break;
  case 'encrypted':
    // content.encryptedData and content.key are available
    break;
}
```

## Component Props Types

### Basic Props
```typescript
interface ComponentProps {
  // Required props
  id: string;
  title: string;
  
  // Optional props
  className?: string;
  style?: React.CSSProperties;
  
  // Callback props
  onClick?: () => void;
  onChange?: (value: string) => void;
  
  // Children
  children?: React.ReactNode;
}
```

### Extended Props
```typescript
// Extend HTML element props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

// Extend component props
interface ExtendedJournalCardProps extends JournalEntry {
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}
```

## React + TypeScript Patterns

### useState with Types
```typescript
// Explicit type
const [count, setCount] = useState<number>(0);

// Complex type
const [entry, setEntry] = useState<JournalEntry | null>(null);

// Array type
const [entries, setEntries] = useState<JournalEntry[]>([]);
```

### useRef Types
```typescript
// DOM element ref
const inputRef = useRef<HTMLInputElement>(null);

// Mutable value ref
const timerRef = useRef<NodeJS.Timeout | null>(null);
```

### Event Types
```typescript
// Form events
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

// Input change
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// Click events
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // Handle click
};
```

## API Integration Types

### React Query Types
```typescript
// Query hook return type
const { 
  data,      // JournalEntry | undefined
  isLoading, // boolean
  error,     // Error | null
  refetch    // () => Promise<QueryObserverResult>
} = useQuery({
  queryKey: ['journal', 'entry', id],
  queryFn: () => getEntry(id)
});

// Mutation hook
const mutation = useMutation<
  JournalEntry,                    // Success data type
  Error,                          // Error type
  CreateJournalEntryRequest       // Variables type
>({
  mutationFn: createEntry
});
```

## Common Type Errors and Solutions

### Error: Type 'string' is not assignable to type 'number'
```typescript
// Problem
<div>{progress.progressValue}</div>  // progressValue is number

// Solution - React converts numbers to strings automatically
<div>{progress.progressValue}</div>  // This is fine!

// Or explicitly convert if needed
<div>{String(progress.progressValue)}</div>
```

### Error: Property does not exist on type
```typescript
// Problem
entry.someProperty  // TypeScript doesn't know about this

// Solution 1: Check the type definition
// Make sure the property exists in the type

// Solution 2: Type assertion (use carefully!)
(entry as any).someProperty

// Solution 3: Extend the type
interface ExtendedEntry extends JournalEntry {
  someProperty: string;
}
```

### Error: Type 'undefined' is not assignable
```typescript
// Problem
const value: string = entry.mood;  // mood is optional

// Solution 1: Add undefined to type
const value: string | undefined = entry.mood;

// Solution 2: Provide default
const value: string = entry.mood ?? 'default';

// Solution 3: Check before use
if (entry.mood) {
  const value: string = entry.mood;  // Now it's defined
}
```

## Best Practices

### 1. Use Strict Mode
Ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

### 2. Avoid `any`
```typescript
// ❌ Bad
const data: any = await fetchData();

// ✅ Good
const data: JournalEntry = await fetchData();

// ✅ When type is truly unknown
const data: unknown = await fetchData();
if (isJournalEntry(data)) {
  // Now data is typed
}
```

### 3. Prefer Interfaces for Objects
```typescript
// ✅ Interface for object shapes
interface User {
  id: string;
  name: string;
}

// ✅ Type for unions/aliases
type Status = 'idle' | 'loading' | 'success' | 'error';
type UserId = string;
```

### 4. Document Complex Types
```typescript
/**
 * Represents a journal entry's goal progress.
 * @property goalId - The ID of the linked goal
 * @property progressValue - Numeric progress value (0-100)
 * @property notes - Optional notes about the progress
 * @property completed - Whether the goal was completed
 */
export interface GoalProgress {
  goalId: string;
  progressValue?: number;
  notes?: string;
  completed: boolean;
}
```

## Debugging Type Issues

### Use TypeScript Language Server
```bash
# Check types without building
npx tsc --noEmit

# Watch for type errors
npx tsc --noEmit --watch

# Generate type declaration files
npx tsc --declaration --emitDeclarationOnly
```

### VSCode Tips
- Hover over variables to see types
- Use "Go to Type Definition" (F12)
- Use "Find All References" (Shift+F12)
- Enable "TypeScript > Preferences: Include Package JSON Auto Imports"

### Type Checking in CI/CD
```json
// package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "build": "npm run type-check && vite build"
  }
}
```

## Migration Guide

### Converting JavaScript to TypeScript
1. Rename `.js` to `.tsx` (for React) or `.ts`
2. Add type imports
3. Define props interfaces
4. Type function parameters and returns
5. Fix type errors incrementally

### Adding Types to Existing Components
```typescript
// Before
const JournalCard = ({ entry, onEdit, onDelete }) => {
  // ...
};

// After
interface JournalCardProps {
  entry: JournalEntry;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const JournalCard: React.FC<JournalCardProps> = ({ 
  entry, 
  onEdit, 
  onDelete 
}) => {
  // ...
};
```

## Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)

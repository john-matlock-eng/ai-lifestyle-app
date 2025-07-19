# AI Lifestyle App - Frontend

## Overview
This document provides comprehensive information about the frontend architecture, types, and patterns used in the AI Lifestyle App. It's designed to help developers (including AI assistants) understand the codebase and avoid common integration issues.

## ⚠️ CRITICAL: Before Making ANY Changes

### 1. Check CI/CD Pipeline
The CI/CD pipeline runs these exact commands:
```bash
# ⚠️ TESTS ARE CURRENTLY DISABLED IN CI/CD - See CI_CD_TESTS_DISABLED.md
# Run these BEFORE committing any changes:
npm run lint          # Must pass with 0 errors (DISABLED IN CI/CD)
npm run type-check    # Must pass with 0 errors (DISABLED IN CI/CD)
npm run test:ci       # Must pass all tests (DISABLED IN CI/CD)
npm run build         # Must build successfully
```

### 2. Current Dependencies Only
**NEVER add imports for packages not in package.json:**
- ❌ NO `react-markdown` 
- ❌ NO `remark-gfm`
- ❌ NO `react-syntax-highlighter`
- ✅ Use only packages listed in package.json

### 3. Run Quality Check Trio
Before ANY commit, run:
```bash
npm run format && npm run lint && npm run type-check
```

### 4. Test Warnings Are NOT Errors
These stderr messages are EXPECTED in tests:
- "Template validation failed ZodError" - Testing invalid templates
- "Failed to fetch feature flags" - Testing error handling
These are NOT failures - they test error handling!

## Related Documentation
- **[TypeScript Guide](./TYPESCRIPT_GUIDE.md)** - Deep dive into the type system
- **[Quick Reference](./QUICK_REFERENCE.md)** - Cheat sheet for common patterns
- **[Journal Feature Guide](./src/features/journal/JOURNAL_DEVELOPER_GUIDE.md)** - Journal-specific documentation

## Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **Styling**: Tailwind CSS with custom glass morphism design system
- **API Client**: Axios
- **Date Handling**: date-fns
- **Forms**: React Hook Form with Zod validation
- **Encryption**: Web Crypto API with custom encryption service

## Project Structure
```
frontend/
├── src/
│   ├── api/                 # API client and endpoints
│   ├── components/         
│   │   ├── common/         # Shared UI components
│   │   └── encryption/     # Encryption-related components
│   ├── contexts/           # React contexts
│   ├── features/           # Feature modules
│   │   ├── journal/       
│   │   ├── goals/         
│   │   ├── meals/         
│   │   └── workouts/      
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Business logic services
│   ├── styles/             # Global styles
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── public/                 # Static assets
└── index.html             
```

## Type System

### Important Type Files
All shared types are defined in `src/types/`:
- `journal.ts` - Journal entry types
- `goals.ts` - Goal types
- `meals.ts` - Meal types
- `workouts.ts` - Workout types
- `auth.ts` - Authentication types
- `encryption.ts` - Encryption types

### Journal Types Reference
```typescript
// From src/types/journal.ts
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
  goalProgress: GoalProgress[];
  createdAt: string;
  updatedAt: string;
  isEncrypted: boolean;
  isShared: boolean;
  encryptedKey?: string;
  encryptionIv?: string;
  sharedWith: string[];
}

export interface GoalProgress {
  goalId: string;
  progressValue?: number;  // Note: This is a number, not string!
  notes?: string;
  completed: boolean;
}
```

## Component Patterns

### Feature Module Structure
Each feature follows this pattern:
```
features/[feature-name]/
├── components/          # Feature-specific components
├── pages/              # Page components (routes)
├── hooks/              # Feature-specific hooks
├── services/           # Feature-specific services
├── templates/          # Feature-specific templates
├── styles/             # Feature-specific styles
├── utils/              # Feature-specific utilities
└── index.ts            # Public exports
```

### Component Guidelines

1. **Always use shared types from `src/types/`**
   ```typescript
   // ✅ Good
   import { JournalEntry } from '@/types/journal';
   
   // ❌ Bad - Don't redefine types locally
   interface JournalEntry { ... }
   ```

2. **Import common components from the index**
   ```typescript
   // ✅ Good
   import { Button, Input } from '@/components/common';
   
   // ❌ Bad
   import Button from '@/components/common/Button';
   ```

3. **Use feature utilities from the correct location**
   ```typescript
   // For journal features
   import { getTemplateIcon, getTemplateName } from '../templates/template-utils';
   import { getEmotionById, getEmotionEmoji } from '../components/EmotionSelector/emotionData';
   ```

## API Integration

### API Client Pattern
```typescript
// All API functions are exported from src/api/[module].ts
import { getEntry, listEntries, createEntry } from '@/api/journal';

// API functions return promises with typed responses
const entry: JournalEntry = await getEntry(entryId);
```

### React Query Usage
```typescript
// Standard query pattern
const { data, isLoading, error } = useQuery({
  queryKey: ['journal', 'entry', entryId],
  queryFn: () => getEntry(entryId),
  enabled: !!entryId
});

// Mutation pattern
const mutation = useMutation({
  mutationFn: (data: CreateJournalEntryRequest) => createEntry(data),
  onSuccess: (newEntry) => {
    // Handle success
  }
});
```

## Styling System

### Glass Morphism Theme
The app uses a custom glass morphism design with these CSS classes:
- `glass` - Main glass effect container
- `glass-hover` - Glass effect with hover state
- `surface` - Solid surface background
- `surface-muted` - Muted surface background

### Tailwind Extensions
Custom colors available:
- `background` - Main background color
- `surface` - Surface color
- `accent` - Accent color
- `theme` - Text color
- `muted` - Muted text color

### Component Styling Pattern
```tsx
// Use className for Tailwind classes
<Button 
  variant="ghost"
  size="sm"
  className="additional-classes"
>
  Content
</Button>
```

## Common Integration Issues & Solutions

### 1. Type Mismatches
**Problem**: Local type definitions conflicting with shared types
**Solution**: Always import types from `@/types/` instead of defining locally

### 2. Missing Imports
**Problem**: Component not found errors
**Solution**: Check the feature's index.ts for proper exports

### 3. API Parameter Issues
**Problem**: API calls failing due to incorrect parameters
**Solution**: Reference the API function signatures in `src/api/`

### 4. Style Import Errors
**Problem**: CSS not loading
**Solution**: Import CSS files at the component level or in the main entry

## Adding New Features

### 1. Create Feature Structure
```bash
src/features/new-feature/
├── components/
├── pages/
├── hooks/
├── services/
└── index.ts
```

### 2. Define Types
Add types to `src/types/new-feature.ts`

### 3. Create API Client
Add API functions to `src/api/new-feature.ts`

### 4. Export Components
Update feature's `index.ts` with public exports

## Testing Patterns

### Component Testing
- Use React Testing Library
- Mock API calls with MSW
- Test user interactions, not implementation

### Type Testing
- TypeScript strict mode is enabled
- Run `npm run type-check` to verify types

## Build & Deployment

### Development
```bash
npm run dev          # Start dev server
npm run type-check   # Check TypeScript types
npm run lint         # Run ESLint
```

### Production Build
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Environment Variables
- `VITE_API_URL` - Backend API URL
- `VITE_APP_VERSION` - App version
- `VITE_SENTRY_DSN` - Sentry error tracking (optional)

## Encryption System

### Key Points
- Uses Web Crypto API
- Master key derived from user password
- Content encrypted with AES-GCM
- Keys stored in IndexedDB (encrypted)

### Usage Pattern
```typescript
import { useEncryption } from '@/contexts/useEncryption';

const { isEncryptionSetup, encryptContent, decryptContent } = useEncryption();
```

## Performance Considerations

### Code Splitting
- Routes are lazy loaded
- Large components use dynamic imports

### Optimization Patterns
- Use React.memo for expensive components
- Use useMemo/useCallback appropriately
- Implement virtual scrolling for long lists

## Debugging Tips

### React Query DevTools
Enabled in development - check the floating button

### Console Helpers
```typescript
// Log API responses
console.log('[API]', response);

// Log component renders
console.log('[Render]', componentName);
```

### Error Boundaries
Implemented at the route level to catch component errors

## Common Gotchas

1. **Date Handling**: All dates are ISO strings in the API
2. **Encryption**: Content must be decrypted before display
3. **Types**: `progressValue` is a number, not string
4. **Routing**: Use navigate() from useNavigate, not window.location
5. **State**: Prefer React Query for server state over useState

## Contributing Guidelines

1. Follow existing patterns
2. Update types when changing API contracts
3. Test thoroughly with TypeScript strict mode
4. Document complex logic with comments
5. Keep components focused and small

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Vite Guide](https://vitejs.dev/guide/)

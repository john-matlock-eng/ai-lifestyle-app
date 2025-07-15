# Journal Feature - Developer Guide

## Overview
The journal feature is one of the most complex modules in the AI Lifestyle App, featuring rich text editing, encryption, sharing, templates, and an enhanced reader mode.

## File Structure
```
src/features/journal/
├── components/
│   ├── JournalCard.tsx              # List item component
│   ├── JournalEntryRenderer.tsx     # Content display component
│   ├── JournalReaderView.tsx        # Enhanced reader mode
│   ├── JournalSearchBar.tsx         # Search functionality
│   ├── EnhancedEditor/              # Rich text editor
│   ├── EmotionSelector/             # Mood selection component
│   └── TemplatePicker/              # Template selection
├── pages/
│   ├── JournalPageEnhanced.tsx      # Main journal list page
│   ├── JournalEditPageEnhanced.tsx  # Create/edit page
│   └── JournalViewPageEnhanced.tsx  # View entry page
├── services/
│   └── JournalStorageService.ts     # IndexedDB storage
├── templates/
│   ├── template-registry.ts         # Template definitions
│   └── template-utils.ts            # Template helpers
└── styles/
    └── journal-reader.css           # Reader mode styles
```

## Key Components

### JournalViewPageEnhanced
The main viewing page that includes:
- Entry display with decryption
- Share functionality
- Reader mode toggle
- Edit/Delete actions

**Required Imports:**
```typescript
import { JournalEntryRenderer } from '../components/JournalEntryRenderer';
import { JournalReaderView } from '../components/JournalReaderView';
import { getEntry, deleteEntry, listEntries } from '@/api/journal';
import '../styles/journal-reader.css'; // For reader mode
```

### JournalReaderView
Enhanced e-reader style component with:
- 3 reading modes (dark, light, sepia)
- 4 font sizes
- Fullscreen support
- Navigation between entries

**Props Interface:**
```typescript
interface JournalReaderViewProps {
  entry: JournalEntry;  // Use the type from @/types/journal
  onEdit: () => void;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrevious: boolean;
  hasNext: boolean;
}
```

### JournalEntryRenderer
Handles rendering different content types:
- Markdown with syntax highlighting
- Template-specific structured content
- Rich text from the editor

**Props Interface:**
```typescript
interface JournalEntryRendererProps {
  entry: {
    content: string;
    template?: string;
    [key: string]: any;
  };
  showMetadata?: boolean;
  className?: string;
}
```

## Template System

### Available Templates
```typescript
export const JOURNAL_TEMPLATES = {
  DAILY_REFLECTION: "daily_reflection",
  GRATITUDE: "gratitude",
  GOALS: "goals",
  REFLECTION: "reflection",
  DREAM: "dream",
  TRAVEL: "travel",
  CREATIVE: "creative",
  BLANK: "blank"
};
```

### Template Icons
```typescript
import { getTemplateIcon, getTemplateName } from '../templates/template-utils';

// Usage
const icon = getTemplateIcon(entry.template); // Returns emoji string
const name = getTemplateName(entry.template); // Returns display name
```

## Emotion/Mood System

### Emotion Data
```typescript
import { getEmotionById, getEmotionEmoji } from '../components/EmotionSelector/emotionData';

// New emotion system
const emotion = getEmotionById(entry.mood);
const emoji = getEmotionEmoji(entry.mood);

// Legacy mood support
const legacyMoods = ['amazing', 'good', 'okay', 'stressed', 'sad'];
```

## API Integration

### List Entries
```typescript
const { data } = await listEntries({
  page?: number,
  limit?: number,
  goalId?: string
});

// Response shape
{
  entries: JournalEntry[],
  total: number,
  page: number,
  limit: number,
  hasMore: boolean
}
```

### CRUD Operations
```typescript
// Create
await createEntry(data: CreateJournalEntryRequest);

// Read
await getEntry(entryId: string);

// Update
await updateEntry(entryId: string, data: UpdateJournalEntryRequest);

// Delete
await deleteEntry(entryId: string);
```

## Encryption Flow

### Viewing Encrypted Entries
```typescript
// 1. Check if entry is encrypted
const isActuallyEncrypted = shouldTreatAsEncrypted(entry);

// 2. Decrypt if needed
if (isActuallyEncrypted && entry.encryptedKey) {
  const encryptionService = getEncryptionService();
  const decrypted = await encryptionService.decryptContent({
    content: entry.content,
    encryptedKey: entry.encryptedKey,
    iv: entry.encryptionIv,
  });
}
```

## Common Patterns

### Loading States
```typescript
if (isLoading) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
    </div>
  );
}
```

### Error Handling
```typescript
if (error || !entry) {
  return (
    <div className="text-center py-12">
      <p className="text-error mb-4">Failed to load journal entry</p>
      <Button onClick={() => navigate('/journal')}>
        Back to Journals
      </Button>
    </div>
  );
}
```

## State Management

### Query Keys Convention
```typescript
// List queries
['journal', 'entries', ...filters]

// Single entry
['journal', 'entry', entryId]

// Stats
['journal', 'stats']

// Shared entries
['journal', 'shared', filter]
```

### Optimistic Updates
```typescript
useMutation({
  mutationFn: updateEntry,
  onMutate: async (newData) => {
    // Cancel queries
    await queryClient.cancelQueries(['journal', 'entry', entryId]);
    
    // Snapshot previous value
    const previousEntry = queryClient.getQueryData(['journal', 'entry', entryId]);
    
    // Optimistically update
    queryClient.setQueryData(['journal', 'entry', entryId], newData);
    
    return { previousEntry };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['journal', 'entry', entryId], context.previousEntry);
  }
});
```

## Styling Guidelines

### Glass Morphism Classes
```typescript
// Main containers
<div className="glass rounded-2xl p-8">

// Cards
<div className="glass-hover rounded-xl p-6">

// Buttons
<Button variant="ghost" className="backdrop-blur-sm">
```

### Responsive Design
```typescript
// Container widths
<div className="container mx-auto max-w-4xl">

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

## Testing Checklist

When adding new journal features:
- [ ] TypeScript compiles without errors
- [ ] All imports use absolute paths (@/)
- [ ] Types are imported from @/types/journal
- [ ] API calls handle loading/error states
- [ ] Encryption works for encrypted entries
- [ ] Component works in all themes
- [ ] Reader mode displays content correctly
- [ ] Mobile responsive
- [ ] Keyboard navigation works

## Common Issues & Solutions

### Issue: Type mismatch with goalProgress
**Cause**: Local type definition differs from shared type
**Solution**: Import `JournalEntry` from `@/types/journal`

### Issue: Template icon not showing
**Cause**: Missing template utility import
**Solution**: `import { getTemplateIcon } from '../templates/template-utils'`

### Issue: Reader mode not working
**Cause**: Missing CSS import or dependencies
**Solution**: 
1. Import `'../styles/journal-reader.css'`
2. Install `react-markdown remark-gfm react-syntax-highlighter`

### Issue: Emotion/mood not displaying
**Cause**: Using old mood system
**Solution**: Use `getEmotionById` and `getEmotionEmoji` with fallback for legacy moods

## Performance Tips

1. **Lazy load the reader view** - Only fetch navigation data when reader opens
2. **Use React.memo** - For expensive components like JournalEntryRenderer
3. **Debounce search** - Add 300ms delay for search queries
4. **Virtual scrolling** - For long journal lists (coming soon)
5. **Image optimization** - Lazy load images in journal content

## Future Enhancements

- [ ] Collaborative editing
- [ ] Voice-to-text entries
- [ ] AI-powered insights
- [ ] Export to PDF/EPUB
- [ ] Advanced search filters
- [ ] Entry versioning
- [ ] Offline support with sync

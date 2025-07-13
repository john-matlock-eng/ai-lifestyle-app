# Journal Feature Documentation

## Overview

The Journal feature is a comprehensive journaling system with rich templates, advanced search, goal integration, and encryption support. It uses IndexedDB for local caching and search optimization.

## Architecture

```
src/features/journal/
├── components/
│   ├── EnhancedEditor/          # New enhanced editor components
│   │   ├── EnhancedJournalEditor.tsx
│   │   └── SectionEditor.tsx
│   ├── EnhancedTemplatePicker.tsx
│   ├── DraftManager.tsx
│   ├── JournalSearchBar.tsx
│   ├── JournalCard.tsx
│   └── SearchResultsSummary.tsx
├── hooks/
│   ├── useJournalSearch.ts      # Search functionality
│   └── useJournalDraft.ts       # Draft management
├── pages/
│   ├── JournalPageEnhanced.tsx  # Main journal list
│   ├── JournalEditPageEnhanced.tsx
│   └── JournalViewPageEnhanced.tsx
├── services/
│   └── JournalStorageService.ts # IndexedDB storage
├── templates/
│   ├── enhanced-templates.ts    # Template definitions
│   └── template-utils.ts
└── types/
    └── enhanced-template.types.ts
```

## Key Features

### 1. Enhanced Templates

Seven built-in templates with rich input types:
- **Daily Reflection**: Mood, gratitude, highlights
- **Gratitude Journal**: Focused gratitude practice
- **Goal Progress**: Track goal advancement
- **Mood Tracker**: Emotional awareness
- **Habit Tracker**: Daily habit checklists
- **Creative Writing**: Prompts and free writing
- **Blank Journal**: Unstructured journaling

### 2. Rich Input Types

- **Text**: Rich text editor with formatting
- **Mood**: Visual mood selector with emojis
- **Scale**: 1-10 rating scales
- **Choice**: Radio button selections
- **Tags**: Dynamic tag input
- **Goals**: Link to active goals
- **Checklist**: Todo-style checkboxes

### 3. Advanced Search

Powered by IndexedDB with:
- Full-text search on content
- Filter by tags, mood, template
- Date range filtering
- Encryption status filter
- Real-time results

### 4. Draft Management

- Auto-save every 5 seconds
- Multiple drafts support
- Draft recovery after browser crash
- 30-day retention

### 5. Goal Integration

- Link journal entries to goals
- Track progress within entries
- Automatic activity logging
- Goal-specific templates

### 6. Privacy & Security

- Client-side encryption option
- Encrypted entries remain searchable by title
- Privacy levels per section
- Secure key management

## Usage

### Creating an Entry

```tsx
import { EnhancedJournalEditor } from '@/features/journal/components/EnhancedEditor';
import { createEntry } from '@/api/journal';

<EnhancedJournalEditor
  templateId={JournalTemplate.DAILY_REFLECTION}
  onSave={async (request) => {
    const entry = await createEntry(request);
    // Entry is automatically indexed for search
  }}
  autoSave={true}
  showEncryption={true}
/>
```

### Searching Entries

```tsx
import { useJournalSearch } from '@/features/journal/hooks/useJournalSearch';

const {
  entries,
  total,
  filters,
  setFilters,
  availableTags,
  availableMoods
} = useJournalSearch();

// Apply filters
setFilters({
  query: 'gratitude',
  mood: 'good',
  tags: ['productivity'],
  startDate: new Date('2024-01-01')
});
```

### Custom Templates

Add custom templates in `enhanced-templates.ts`:

```typescript
export const myTemplate: EnhancedTemplate = {
  id: JournalTemplate.CUSTOM,
  name: 'My Custom Template',
  sections: [
    {
      id: 'custom-section',
      title: 'Custom Input',
      prompt: 'Your prompt here',
      type: 'text',
      required: true
    }
  ],
  extractors: {
    tags: (responses) => ['custom-tag'],
    mood: (responses) => responses.mood
  }
};
```

## Data Flow

1. **User Input** → Section-based form inputs
2. **Metadata Extraction** → Tags, mood, goals extracted
3. **Content Compilation** → Sections → Markdown
4. **Storage** → API + IndexedDB
5. **Search** → IndexedDB queries with filters

## API Integration

The journal system expects these API endpoints:

```typescript
// Create entry
POST /api/journal
Body: CreateJournalEntryRequest

// Update entry
PUT /api/journal/:entryId
Body: UpdateJournalEntryRequest

// Get entry
GET /api/journal/:entryId

// List entries
GET /api/journal?page=1&limit=20

// Delete entry
DELETE /api/journal/:entryId
```

## Performance

- **IndexedDB**: Local caching for instant search
- **Debounced Search**: 300ms delay on typing
- **Lazy Loading**: Sections render on demand
- **Auto-save**: Throttled to prevent excessive writes
- **Pagination**: 12 entries per page default

## Customization

### Theme Variables

```css
/* Required CSS variables */
--background: /* Page background */
--surface: /* Card background */
--surface-hover: /* Hover state */
--surface-muted: /* Disabled state */
--theme: /* Primary text */
--muted: /* Secondary text */
--accent: /* Primary color */
--success: /* Success state */
--warning: /* Warning state */
--error: /* Error state */
```

### Extending Input Types

1. Add type to `SectionDefinition`
2. Create input component in `SectionEditor.tsx`
3. Handle in content compilation
4. Add extraction logic if needed

### Search Optimization

- Add indexes in `JournalStorageService`
- Update search filters interface
- Extend `useJournalSearch` hook

## Testing

### Unit Tests
- Template validation
- Metadata extraction
- Content compilation
- Search filters

### Integration Tests
- Create → Search → Find flow
- Draft save/load cycle
- Goal linking
- Encryption/decryption

### E2E Tests
- Complete journal entry flow
- Search with filters
- Draft recovery
- Mobile responsiveness

## Troubleshooting

### Common Issues

**Search not working**
- Check IndexedDB in DevTools
- Verify entries are being saved
- Clear and rebuild index

**Templates not loading**
- Check template ID matches enum
- Verify import paths
- Check console for errors

**Drafts not saving**
- Check localStorage quota
- Verify draft key format
- Clear old drafts

**Styles broken**
- Ensure Tailwind is configured
- Check theme variables
- Verify component classes

## Future Enhancements

- [ ] Voice dictation
- [ ] AI-powered insights
- [ ] Template marketplace
- [ ] Collaborative journals
- [ ] Export to PDF/Markdown
- [ ] Advanced analytics
- [ ] Mobile app sync
- [ ] Backup/restore

## Contributing

1. Follow existing patterns
2. Add tests for new features
3. Update documentation
4. Maintain backward compatibility
5. Consider search impact
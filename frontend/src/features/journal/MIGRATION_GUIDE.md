# Journal System Migration Guide

This guide will help you migrate from the old journal components to the new enhanced journal system.

## Overview

The enhanced journal system provides:
- Rich template-based editing with multiple input types
- Full compatibility with existing search infrastructure
- Automatic metadata extraction for better search
- Draft management
- Goal integration
- Enhanced UI/UX

## Step 1: Update Routes

Update your router configuration to use the enhanced pages:

```tsx
// App.tsx or routes.tsx
import { 
  JournalPageEnhanced, 
  JournalEditPageEnhanced, 
  JournalViewPageEnhanced 
} from '@/features/journal/pages';

// Replace old routes with enhanced versions
<Route path="/journal" element={<JournalPageEnhanced />} />
<Route path="/journal/:entryId" element={<JournalViewPageEnhanced />} />
<Route path="/journal/:entryId/edit" element={<JournalEditPageEnhanced />} />
```

## Step 2: Archive Old Components

Move old components to an archive folder (keep for reference):

```bash
# Create archive directory
mkdir src/features/journal/components/_archive

# Move old components
mv src/features/journal/components/JournalEditor.tsx _archive/
mv src/features/journal/components/JournalEditorWithSections.tsx _archive/
mv src/features/journal/components/EditorSection.tsx _archive/
mv src/features/journal/components/JournalTemplateDemo.tsx _archive/
```

## Step 3: Update Imports

If you have other components importing the old journal editors, update them:

```tsx
// Old import
import { JournalEditor } from '@/features/journal/components';

// New import
import { EnhancedJournalEditor } from '@/features/journal/components/EnhancedEditor';
```

## Step 4: Update API Calls (if needed)

The enhanced system works with your existing API. No changes needed if you're using:
- `createEntry`
- `updateEntry`
- `getEntry`
- `listEntries`
- `deleteEntry`

## Step 5: Theme Variables

Ensure your theme has these CSS variables defined:

```css
:root {
  /* Colors */
  --background: #ffffff;
  --surface: #f9fafb;
  --surface-hover: #f3f4f6;
  --surface-muted: #e5e7eb;
  
  --theme: #111827;
  --muted: #6b7280;
  
  --accent: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
}

/* Dark mode */
[data-theme="dark"] {
  --background: #0f172a;
  --surface: #1e293b;
  --surface-hover: #334155;
  --surface-muted: #475569;
  
  --theme: #f1f5f9;
  --muted: #94a3b8;
}
```

## Step 6: Install Missing Dependencies

If you haven't already, install required dependencies:

```bash
npm install date-fns react-markdown
```

## Step 7: Test the Migration

1. **Create a new entry**: Test all templates
2. **Edit existing entries**: Ensure old entries load correctly
3. **Search functionality**: Verify search still works
4. **Draft management**: Test saving and loading drafts
5. **Goal integration**: Link goals to entries

## Step 8: Optional Enhancements

### Add Custom Templates

Create custom templates in `enhanced-templates.ts`:

```typescript
export const customTemplate: EnhancedTemplate = {
  id: 'custom_template',
  name: 'Custom Template',
  description: 'Your custom journal template',
  icon: '📖',
  color: '#8b5cf6',
  sections: [
    // Your custom sections
  ]
};
```

### Add New Input Types

Extend `SectionEditor.tsx` to support new input types:

```tsx
case 'location':
  return <LocationInput section={section} value={value} onChange={onChange} />;
```

### Customize Metadata Extraction

Update template extractors for better search:

```typescript
extractors: {
  tags: (responses) => {
    // Custom logic to extract tags from responses
  },
  mood: (responses) => {
    // Custom mood detection logic
  }
}
```

## Step 9: Clean Up

Once everything is working:

1. Remove old components from `_archive` if no longer needed
2. Update documentation
3. Remove old styles from `journal-editor.css` if not used

## Troubleshooting

### Search not finding new entries
- Ensure `journalStorage.saveEntry()` is called after create/update
- Check browser console for IndexedDB errors

### Templates not loading
- Verify template IDs match `JournalTemplate` enum values
- Check `enhanced-templates.ts` imports

### Styles not applying
- Ensure theme CSS variables are defined
- Check Tailwind classes are available
- Verify `glass` utility class is defined

### Draft issues
- Clear localStorage if corrupted: `localStorage.clear()`
- Check draft key format matches expected pattern

## Benefits After Migration

✅ **Better UX**: Guided templates with rich inputs
✅ **Enhanced Search**: Automatic tagging and metadata
✅ **Draft Management**: Never lose work
✅ **Goal Integration**: Track progress directly
✅ **Mobile Friendly**: Responsive design
✅ **Future Proof**: Easy to extend

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all files are in correct locations
3. Ensure dependencies are installed
4. Test with a fresh browser profile
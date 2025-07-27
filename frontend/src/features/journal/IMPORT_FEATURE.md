# Journal Import Feature

## Overview

The Journal Import feature allows users to import existing journal entries from external sources into the AI Lifestyle App. This is particularly useful for users who want to migrate their existing journal entries or import content from other journaling apps.

## Components

### JournalImporter Component

Located at: `src/features/journal/components/JournalImporter.tsx`

This is the main UI component that provides:

- Title input field
- Date picker (allowing selection of past dates)
- Emotion/mood selector using the existing EmotionSelector component
- Content textarea for pasting journal text
- Tags input (comma-separated)
- Live preview of the entry

### JournalImportPage

Located at: `src/features/journal/pages/JournalImportPage.tsx`

This page component handles:

- Integration with the journal creation API
- Encryption support (if enabled)
- Navigation and routing
- Error handling

## Usage

### For Users

1. Navigate to the Journal page
2. Click the "Import" button in the header
3. Fill in the import form:
   - Enter a title for your journal entry
   - Select the original date of the entry
   - Choose the mood/emotion you were feeling
   - Paste or type your journal content
   - Add optional tags
4. Review the preview
5. Click "Import Entry" to save

### For Developers

To use the JournalImporter component in your code:

```typescript
import { JournalImporter } from '@/features/journal/components';
import { createEntry } from '@/api/journal';

// In your component
const handleImport = async (importData: CreateJournalEntryRequest) => {
  // Handle the import logic
  await createEntry(importData);
};

<JournalImporter
  onImport={handleImport}
  onCancel={() => navigate('/journal')}
  isEncryptionEnabled={isEncryptionSetup}
/>
```

## Features

### Date Selection

- Users can select any date up to the current date
- This allows importing historical journal entries with their original dates

### Mood/Emotion Selection

- Uses the existing EmotionSelector component
- Provides the full emotion wheel interface
- Selected mood is saved with the journal entry

### Content Import

- Supports plain text input
- Preserves formatting (line breaks, paragraphs)
- Shows real-time word count
- Validates that content is not empty

### Tags

- Optional comma-separated tags
- Automatically trims whitespace
- Displayed as chips in the preview

### Preview

- Live preview of how the entry will appear
- Shows formatted date, mood, content, and tags
- Updates in real-time as user types

## Integration Points

### API

- Uses the standard `createEntry` API endpoint
- Supports encryption if enabled in user settings
- Saves to IndexedDB for offline search

### Routing

Add this route to your router configuration:

```typescript
<Route path="/journal/import" element={<JournalImportPage />} />
```

### Navigation

The import button is automatically added to the JournalPageEnhanced header.

## Styling

- Uses the app's glass morphism design system
- Consistent with other journal components
- Responsive design for mobile and desktop

## Future Enhancements

- Bulk import from CSV/JSON files
- Import from popular journaling apps (Day One, Journey, etc.)
- Template detection based on content structure
- Rich text editor support
- Image attachments

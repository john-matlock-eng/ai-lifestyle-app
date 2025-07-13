# Encryption Detection Fix

## Problem
The backend API is returning journal entries with `isEncrypted: true` even though the content is clearly not encrypted (plain text markdown). This causes the UI to hide the content and show "This entry is encrypted" instead of the actual content.

Example response showing the issue:
```json
{
  "entryId": "2a4bda5e-0702-4eb2-b091-f08946267477",
  "content": "## Today's Emotions\n\nEmotions: happy, accepted...", // Plain text!
  "isEncrypted": true,  // But marked as encrypted
  ...
}
```

## Solution
Created a utility module (`encryption-utils.ts`) that:

1. **Detects if content is actually encrypted** by checking:
   - If content contains readable text patterns (markdown, sentences, etc.)
   - If content is valid base64 encoded binary data
   - The entropy of decoded content

2. **Provides safe methods** for:
   - `shouldTreatAsEncrypted()` - Determines if entry should be treated as encrypted
   - `getSafeExcerpt()` - Gets content preview, handling both encrypted and plain text

## Implementation

### Updated Components:
1. **JournalCard.tsx** - Uses `shouldTreatAsEncrypted()` to show correct lock icon and `getSafeExcerpt()` for preview
2. **JournalPage.tsx** - Uses same utilities for consistent behavior

### How It Works:
```typescript
// For the problematic entry:
const entry = {
  content: "## Today's Emotions...",  // Plain text
  isEncrypted: true  // Incorrect flag
};

// Old behavior:
// Would show "🔒 This entry is encrypted"

// New behavior:
shouldTreatAsEncrypted(entry) // Returns false (detects plain text)
getSafeExcerpt(entry.content, entry.isEncrypted) // Returns actual content preview
```

## Result
- Plain text entries incorrectly marked as encrypted now display properly
- Actually encrypted entries still show as encrypted
- No data loss or security compromise
- Graceful handling of backend inconsistencies

## Future Considerations
- The backend should be fixed to correctly set `isEncrypted: false` for unencrypted content
- Consider adding a data migration to fix existing entries
- Add validation on the backend to ensure consistency between `isEncrypted` flag and actual content state

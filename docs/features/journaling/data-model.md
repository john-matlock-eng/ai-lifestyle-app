# Journaling Feature - Data Model Design

## ⚠️ IMPORTANT: Goal System Update
**Note**: This document has been updated to use the [Generic Goal System](../core/goal-system-design-v2.md). Journaling goals are now created using the generic goal model with journaling-specific metadata.

## Overview
The journaling feature supports private reflection, goal-based writing, AI-assisted insights, and optional social sharing. The data model is designed for flexibility, privacy, and scalability.

## Core Entities

### 1. Journal Entries
```typescript
interface JournalEntry {
  // Identification
  entryId: string;          // ENTRY#{uuid}
  userId: string;           // USER#{userId}
  
  // Content
  title: string;
  content: string;          // Markdown/TipTap JSON
  contentPlainText: string; // For search/AI analysis
  wordCount: number;
  readingTime: number;      // Estimated minutes
  
  // Privacy & Sharing
  visibility: 'private' | 'shared' | 'friends';
  sharedAt?: Date;
  shareSettings?: {
    allowComments: boolean;
    allowReactions: boolean;
    expiresAt?: Date;     // Temporary sharing
  };
  
  // Organization
  goalId?: string;          // Link to generic goal (type: 'journal')
  promptId?: string;        // AI or custom prompt used
  tags: string[];
  mood?: 'great' | 'good' | 'neutral' | 'difficult' | 'challenging';
  
  // AI Insights
  aiInsights?: {
    sentiment: number;      // -1 to 1
    themes: string[];       // Extracted themes
    suggestions: string[];  // Reflection prompts
    summary?: string;       // AI-generated summary
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
  deletedAt?: Date;         // Soft delete
  
  // Media
  attachments?: {
    type: 'image' | 'audio';
    url: string;
    thumbnailUrl?: string;
    duration?: number;      // For audio
  }[];
}
```

### 2. Journaling Goals - NOW USES GENERIC GOAL SYSTEM
```typescript
// ❌ OLD - DO NOT USE
// interface JournalingGoal { ... }

// ✅ NEW - Use Generic Goal with metadata
import { Goal } from '../core/goal-system-design-v2';

// Example journaling goal using generic system:
const journalingGoal: Goal = {
  goalType: 'journal',
  goalPattern: 'recurring',
  title: 'Daily Gratitude Journal',
  
  target: {
    metric: 'count',
    value: 1,
    unit: 'entry',
    period: 'day',
    direction: 'increase',
    targetType: 'minimum'
  },
  
  schedule: {
    frequency: 'daily',
    preferredTimes: ['21:00']
  },
  
  // Journaling-specific data in metadata
  metadata: {
    category: 'gratitude',
    prompts: [
      {
        promptId: 'prompt-1',
        text: 'What are three things you are grateful for today?',
        order: 1,
        optional: false
      }
    ],
    useAiPrompts: true,
    preferredTopics: ['gratitude', 'personal-growth'],
    privacyLevel: 'private'
  }
};
```

### 3. Prompts & Templates
```typescript
interface JournalPrompt {
  promptId: string;         // PROMPT#{uuid}
  userId?: string;          // null for system prompts
  
  // Prompt Details
  title: string;
  category: string;
  description?: string;
  
  // Content
  questions: {
    text: string;
    type: 'open' | 'scale' | 'choice';
    options?: string[];     // For choice type
    required: boolean;
  }[];
  
  // AI Configuration
  aiEnhanced: boolean;
  aiContext?: string;       // Additional context for AI
  
  // Usage
  isTemplate: boolean;
  isPublic: boolean;
  usageCount: number;
  rating?: number;
  
  // Metadata
  createdAt: Date;
  updatedBy?: string;
}
```

### 4. Social Interactions
```typescript
interface JournalInteraction {
  interactionId: string;    // INTERACTION#{uuid}
  entryId: string;
  userId: string;           // Who interacted
  
  type: 'comment' | 'reaction' | 'share';
  
  // For comments
  comment?: {
    text: string;
    parentId?: string;      // For nested comments
  };
  
  // For reactions
  reaction?: 'heart' | 'support' | 'insightful' | 'inspiring';
  
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
```

## DynamoDB Schema Design

### Primary Table: `journaling`
Note: Journaling goals are stored in the main `goals` table, not here.

| PK | SK | Type | GSI1PK | GSI1SK | GSI2PK | GSI2SK |
|----|----|----|--------|--------|--------|--------|
| USER#123 | ENTRY#456 | JournalEntry | ENTRY#456 | 2024-01-15 | SHARED | 2024-01-15 |
| ENTRY#456 | INTERACTION#abc | JournalInteraction | USER#567 | 2024-01-15 | - | - |
| SYSTEM | PROMPT#def | JournalPrompt | CATEGORY#gratitude | RATING#4.5 | PUBLIC | 2024-01-01 |

### Access Patterns

1. **User's Entries**
   - Query: PK = `USER#{userId}`, SK begins with `ENTRY#`
   - Sort by created date descending

2. **Single Entry with Interactions**
   - Query: PK = `ENTRY#{entryId}`
   - Returns entry + all comments/reactions

3. **Shared Entries Feed**
   - Query GSI1: PK = `SHARED`, sorted by date
   - Filter by visibility and user relationships

4. **Entries for a Goal**
   - Query: PK = `USER#{userId}`, filter by goalId attribute
   - Goal details fetched from generic goals table

5. **Public Prompts by Category**
   - Query GSI1: PK = `CATEGORY#{category}`

## Integration with Generic Goal System

### Creating a Journaling Goal
```typescript
// Use the generic goal API
POST /goals
{
  "goalType": "journal",
  "goalPattern": "recurring",
  "title": "Evening Reflection",
  "target": {
    "metric": "count",
    "value": 1,
    "unit": "entry",
    "period": "day"
  },
  "metadata": {
    "prompts": [...],
    "category": "reflection"
  }
}
```

### Tracking Journal Progress
```typescript
// When user completes a journal entry
POST /goals/{goalId}/track
{
  "value": 1,
  "unit": "entry",
  "activityDate": "2024-01-15",
  "context": {
    "mood": "good",
    "wordCount": 523,
    "entryId": "entry-123"
  }
}
```

### Benefits of Generic System
1. **Unified Dashboard**: Journal goals appear with all other lifestyle goals
2. **Cross-Goal Insights**: "You journal more on days you exercise"
3. **Consistent UX**: Same progress tracking, reminders, streaks
4. **Reusable Infrastructure**: No duplicate code for goals

## Privacy & Security Considerations

### 1. Encryption
- All journal content encrypted at rest
- Additional client-side encryption option for ultra-sensitive entries
- Separate encryption keys per user

### 2. Access Control
```typescript
enum Visibility {
  PRIVATE = 'private',        // Only author can view
  SHARED = 'shared',         // Public to all users
  FRIENDS = 'friends',       // Only connections
  LINK = 'link'             // Anyone with link
}
```

### 3. Data Retention
- Soft delete with 30-day recovery period
- Permanent deletion after 30 days
- Export functionality for data portability

## AI Integration Points

### 1. Prompt Generation
- Dynamic prompts based on:
  - User's recent entries
  - Identified patterns/themes
  - Goal progress (from generic system)
  - Time of day/season

### 2. Content Analysis
- Sentiment tracking over time
- Theme extraction and tagging
- Mental health indicators (with consent)
- Writing style insights

### 3. Reflection Assistance
- Follow-up questions during writing
- Gentle challenges to negative thought patterns
- Celebration of positive patterns
- Connection to previous insights

## Storage Estimates

### Per Entry
- Average entry: 2KB (500 words)
- Metadata: 1KB
- AI insights: 0.5KB
- Total: ~3.5KB per entry

### Per User (Active Journaler)
- 30 entries/month = 105KB
- 365 entries/year = 1.3MB
- 5 years = 6.5MB

### Cost Projections (DynamoDB)
- Write: $1.25 per million writes
- Read: $0.25 per million reads
- Storage: $0.25 per GB/month

For 10,000 active users:
- Storage: 65GB = $16.25/month
- Writes: 300K/month = $0.38/month
- Reads: 3M/month = $0.75/month
- **Total: ~$18/month**

## Migration Notes

### From Old JournalingGoal to Generic Goal
If migrating from an older version that had journaling-specific goals:
1. Create new generic goals with `goalType: 'journal'`
2. Move journaling-specific fields to `metadata`
3. Update journal entries to reference new goal IDs
4. Archive old journaling goals table

## Future Enhancements
1. **Voice Journaling**
   - Audio transcription
   - Voice mood analysis
   
2. **Collaborative Journals**
   - Shared family/team journals
   - Turn-based prompts
   
3. **Advanced Analytics**
   - Mood tracking over time
   - Word clouds and trends
   - Achievement badges
   - Integration with generic goal insights

## Related Documentation
- [Generic Goal System](../core/goal-system-design-v2.md)
- [Goal System Integration](./goal-system-integration.md)
- [Journaling API Contract](./api-contract.md)
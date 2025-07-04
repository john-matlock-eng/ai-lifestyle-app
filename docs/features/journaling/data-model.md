# Journaling Feature - Data Model Design

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
  goalId?: string;          // Link to journaling goal
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

### 2. Journaling Goals
```typescript
interface JournalingGoal {
  goalId: string;           // GOAL#{uuid}
  userId: string;           // USER#{userId}
  
  // Goal Definition
  title: string;            // "Morning Reflections"
  description: string;
  category: 'gratitude' | 'reflection' | 'goals' | 'mood' | 'custom';
  
  // Schedule
  frequency: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    daysOfWeek?: number[];  // 0-6 for weekly
    dayOfMonth?: number;    // 1-31 for monthly
    customCron?: string;    // Advanced scheduling
  };
  
  // Reminders
  reminderTime?: string;    // "09:00" in user's timezone
  reminderEnabled: boolean;
  
  // Prompts
  prompts: {
    promptId: string;
    text: string;
    order: number;
    optional: boolean;
  }[];
  useAiPrompts: boolean;    // Generate dynamic prompts
  
  // Progress Tracking
  targetEntries?: number;   // Entries per period
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  lastEntryDate?: Date;
  
  // Status
  status: 'active' | 'paused' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;           // For time-bound goals
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
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

| PK | SK | Type | GSI1PK | GSI1SK | GSI2PK | GSI2SK |
|----|----|----|--------|--------|--------|--------|
| USER#123 | ENTRY#456 | JournalEntry | ENTRY#456 | 2024-01-15 | SHARED | 2024-01-15 |
| USER#123 | GOAL#789 | JournalingGoal | GOAL#789 | ACTIVE | USER#123#DAILY | 2024-01-15 |
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

4. **User's Active Goals**
   - Query GSI1: PK = `GOAL#{goalId}`, SK = `ACTIVE`

5. **Entries for a Goal**
   - Query: PK = `USER#{userId}`, filter by goalId attribute

6. **Public Prompts by Category**
   - Query GSI1: PK = `CATEGORY#{category}`

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
  - Goal progress
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

## Migration & Versioning

### Schema Version
- Current: `v1.0`
- Version stored with each record
- Migration scripts for updates

### Future Enhancements
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

## Integration with Other Modules

### 1. Wellness Module
- Link mood entries to wellness metrics
- Correlate journaling with health outcomes

### 2. Goals Module  
- Connect journal entries to life goals
- Track progress through reflection

### 3. Social Module
- Share inspirational entries
- Build support communities

### 4. AI Coach Module
- Personalized insights
- Guided meditation/reflection

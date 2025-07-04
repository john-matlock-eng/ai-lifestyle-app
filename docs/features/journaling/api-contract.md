# Journaling Feature - API Contract Design

## Overview
RESTful API design for journaling functionality with support for CRUD operations, AI integration, and social features.

## Endpoints

### Journal Entries

#### Create Journal Entry
```yaml
POST /journal/entries
```

**Request:**
```json
{
  "title": "Morning Reflections",
  "content": {
    "type": "doc",
    "content": [...]  // TipTap JSON
  },
  "contentMarkdown": "# Morning Reflections\n\nToday I'm grateful for...",
  "visibility": "private",
  "goalId": "goal-123",
  "promptId": "prompt-456",
  "tags": ["gratitude", "morning"],
  "mood": "good",
  "attachments": [
    {
      "type": "image",
      "url": "s3://bucket/image.jpg"
    }
  ]
}
```

**Response (201):**
```json
{
  "entryId": "entry-789",
  "userId": "user-123",
  "title": "Morning Reflections",
  "wordCount": 245,
  "readingTime": 2,
  "createdAt": "2024-01-15T09:30:00Z",
  "aiInsights": {
    "sentiment": 0.8,
    "themes": ["gratitude", "family", "growth"],
    "suggestions": [
      "You mentioned feeling grateful for your family. What specific moment made you feel this way?"
    ]
  }
}
```

#### Get Journal Entries
```yaml
GET /journal/entries
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `visibility` (private|shared|all)
- `goalId` (filter by goal)
- `tags` (comma-separated)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `mood` (filter by mood)
- `search` (full-text search)

**Response (200):**
```json
{
  "entries": [
    {
      "entryId": "entry-789",
      "title": "Morning Reflections",
      "excerpt": "Today I'm grateful for the sunny weather and...",
      "visibility": "private",
      "tags": ["gratitude", "morning"],
      "mood": "good",
      "wordCount": 245,
      "createdAt": "2024-01-15T09:30:00Z",
      "hasAiInsights": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

#### Get Single Entry
```yaml
GET /journal/entries/{entryId}
```

**Response (200):**
```json
{
  "entryId": "entry-789",
  "userId": "user-123",
  "title": "Morning Reflections",
  "content": {
    "type": "doc",
    "content": [...]
  },
  "contentMarkdown": "# Morning Reflections\n\nToday I'm grateful for...",
  "visibility": "private",
  "shareSettings": null,
  "goalId": "goal-123",
  "promptId": "prompt-456",
  "tags": ["gratitude", "morning"],
  "mood": "good",
  "wordCount": 245,
  "readingTime": 2,
  "aiInsights": {
    "sentiment": 0.8,
    "themes": ["gratitude", "family", "growth"],
    "suggestions": [...],
    "summary": "A positive reflection focusing on gratitude for family and personal growth."
  },
  "attachments": [...],
  "createdAt": "2024-01-15T09:30:00Z",
  "updatedAt": "2024-01-15T09:30:00Z",
  "stats": {
    "views": 1,
    "comments": 0,
    "reactions": 0
  }
}
```

#### Update Journal Entry
```yaml
PUT /journal/entries/{entryId}
```

**Request:**
```json
{
  "title": "Morning Reflections (Updated)",
  "content": {...},
  "contentMarkdown": "...",
  "visibility": "shared",
  "shareSettings": {
    "allowComments": true,
    "allowReactions": true,
    "expiresAt": "2024-02-15T00:00:00Z"
  },
  "tags": ["gratitude", "morning", "family"]
}
```

#### Delete Journal Entry
```yaml
DELETE /journal/entries/{entryId}
```

**Response (200):**
```json
{
  "message": "Entry deleted successfully",
  "recoveryDeadline": "2024-02-14T09:30:00Z"
}
```

### Journaling Goals

#### Create Journaling Goal
```yaml
POST /journal/goals
```

**Request:**
```json
{
  "title": "Daily Gratitude Practice",
  "description": "Write three things I'm grateful for each day",
  "category": "gratitude",
  "frequency": {
    "type": "daily"
  },
  "reminderTime": "21:00",
  "reminderEnabled": true,
  "prompts": [
    {
      "text": "What are three things you're grateful for today?",
      "order": 1,
      "optional": false
    },
    {
      "text": "Who made a positive impact on your day?",
      "order": 2,
      "optional": true
    }
  ],
  "useAiPrompts": true,
  "targetEntries": 30,
  "startDate": "2024-01-15",
  "endDate": "2024-02-14"
}
```

#### Get User's Goals
```yaml
GET /journal/goals
```

**Query Parameters:**
- `status` (active|paused|completed|archived|all)
- `category` (gratitude|reflection|goals|mood|custom)

#### Update Goal Progress
```yaml
POST /journal/goals/{goalId}/checkin
```

**Request:**
```json
{
  "entryId": "entry-789",
  "completed": true
}
```

### AI Integration

#### Generate AI Prompt
```yaml
POST /journal/ai/generate-prompt
```

**Request:**
```json
{
  "category": "reflection",
  "context": {
    "recentThemes": ["work-stress", "family"],
    "mood": "neutral",
    "timeOfDay": "evening"
  },
  "previousPromptIds": ["prompt-123", "prompt-456"]
}
```

**Response (200):**
```json
{
  "prompt": {
    "promptId": "ai-prompt-789",
    "title": "Evening Reflection on Balance",
    "questions": [
      {
        "text": "You've mentioned work stress recently. What's one small step you could take tomorrow to create more balance?",
        "type": "open",
        "required": false
      },
      {
        "text": "On a scale of 1-10, how supported do you feel by your family right now?",
        "type": "scale",
        "required": false
      }
    ]
  }
}
```

#### Analyze Entry
```yaml
POST /journal/ai/analyze
```

**Request:**
```json
{
  "entryId": "entry-789",
  "analysisType": ["sentiment", "themes", "suggestions"]
}
```

**Response (200):**
```json
{
  "analysis": {
    "sentiment": {
      "score": 0.65,
      "label": "positive",
      "confidence": 0.89
    },
    "themes": [
      {
        "theme": "personal-growth",
        "confidence": 0.92
      },
      {
        "theme": "gratitude",
        "confidence": 0.87
      }
    ],
    "suggestions": [
      "Your focus on personal growth is inspiring. Consider setting a specific goal for the next week.",
      "You mentioned feeling grateful but also stressed. How might gratitude help you manage stress?"
    ],
    "patterns": {
      "moodTrend": "improving",
      "commonThemes": ["family", "work", "growth"],
      "writingConsistency": "high"
    }
  }
}
```

### Social Features

#### Share Entry
```yaml
POST /journal/entries/{entryId}/share
```

**Request:**
```json
{
  "visibility": "shared",
  "shareSettings": {
    "allowComments": true,
    "allowReactions": true,
    "expiresAt": null
  }
}
```

#### Get Shared Feed
```yaml
GET /journal/shared
```

**Query Parameters:**
- `filter` (all|friends|following)
- `tags` (comma-separated)
- `page` (default: 1)
- `limit` (default: 20)

#### Add Comment
```yaml
POST /journal/entries/{entryId}/comments
```

**Request:**
```json
{
  "text": "Thank you for sharing this. Your reflection on gratitude really resonated with me.",
  "parentId": null
}
```

#### Add Reaction
```yaml
POST /journal/entries/{entryId}/reactions
```

**Request:**
```json
{
  "type": "heart"
}
```

### Templates & Prompts

#### Get Public Prompts
```yaml
GET /journal/prompts
```

**Query Parameters:**
- `category` (gratitude|reflection|goals|mood)
- `search` (text search)
- `sort` (popular|newest|rating)

#### Create Custom Prompt
```yaml
POST /journal/prompts
```

**Request:**
```json
{
  "title": "Weekly Career Reflection",
  "category": "goals",
  "description": "Reflect on your professional growth and goals",
  "questions": [
    {
      "text": "What was your biggest professional win this week?",
      "type": "open",
      "required": true
    },
    {
      "text": "What challenge taught you the most?",
      "type": "open",
      "required": false
    }
  ],
  "isPublic": true
}
```

### Analytics & Insights

#### Get Journal Statistics
```yaml
GET /journal/stats
```

**Query Parameters:**
- `period` (week|month|year|all)
- `groupBy` (day|week|month)

**Response (200):**
```json
{
  "stats": {
    "totalEntries": 156,
    "currentStreak": 14,
    "longestStreak": 30,
    "averageWordCount": 324,
    "totalWords": 50544,
    "moodDistribution": {
      "great": 23,
      "good": 67,
      "neutral": 45,
      "difficult": 18,
      "challenging": 3
    },
    "topThemes": [
      {"theme": "gratitude", "count": 89},
      {"theme": "family", "count": 67},
      {"theme": "growth", "count": 54}
    ],
    "writingTimes": {
      "morning": 45,
      "afternoon": 23,
      "evening": 78,
      "night": 10
    },
    "goalsProgress": [
      {
        "goalId": "goal-123",
        "title": "Daily Gratitude",
        "completion": 0.87,
        "streak": 14
      }
    ]
  }
}
```

#### Export Journal Data
```yaml
POST /journal/export
```

**Request:**
```json
{
  "format": "markdown",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "includePrivate": true,
  "includeAiInsights": true
}
```

**Response (202):**
```json
{
  "exportId": "export-123",
  "status": "processing",
  "estimatedTime": 300,
  "message": "Your export is being prepared. You'll receive an email when it's ready."
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": {
    "field": "content",
    "issue": "Content cannot be empty"
  },
  "requestId": "req-123",
  "timestamp": "2024-01-15T09:30:00Z"
}
```

### Error Codes
- `ENTRY_NOT_FOUND` - Journal entry does not exist
- `GOAL_NOT_FOUND` - Journaling goal does not exist  
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks permission
- `VALIDATION_ERROR` - Invalid request data
- `CONTENT_TOO_LONG` - Entry exceeds max length (10,000 words)
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AI_SERVICE_ERROR` - AI analysis temporarily unavailable

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Create Entry | 10/hour |
| Update Entry | 30/hour |
| AI Analysis | 20/hour |
| AI Prompt Generation | 30/hour |
| Export | 2/day |

## Webhook Events

For future integration with other services:

```json
{
  "event": "journal.entry.created",
  "data": {
    "entryId": "entry-789",
    "userId": "user-123",
    "visibility": "private",
    "hasGoal": true
  },
  "timestamp": "2024-01-15T09:30:00Z"
}
```

Events:
- `journal.entry.created`
- `journal.entry.updated`
- `journal.entry.shared`
- `journal.goal.completed`
- `journal.streak.milestone` (7, 30, 100 days)

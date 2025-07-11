# Generic Goal System - API Contract

## Overview
RESTful API design for the universal goal system supporting all lifestyle tracking features.

## Base Endpoints

### Create Goal
```yaml
POST /goals
```

**Request:**
```json
{
  "goalType": "journal|workout|nutrition|reading|meditation|custom",
  "goalPattern": "recurring|milestone|target|streak|limit",
  "title": "Read 30 minutes daily",
  "description": "Build a consistent reading habit before bed",
  "category": "education",
  "icon": "📚",
  "color": "#6366F1",
  
  "target": {
    "metric": "count|duration|amount|weight|distance|calories|money|custom",
    "value": 30,
    "unit": "minutes",
    "period": "day",
    "direction": "increase",
    "targetType": "minimum",
    "targetDate": "2024-12-31",  // For target goals
    "startValue": 0,             // For progress tracking
    "minValue": 15,              // For ranges
    "maxValue": 60               // For ranges
  },
  
  "schedule": {
    "frequency": "daily|weekly|monthly|custom",
    "daysOfWeek": [1, 2, 3, 4, 5],  // Mon-Fri
    "preferredTimes": ["21:00"],
    "checkInFrequency": "daily",
    "allowSkipDays": 2,
    "catchUpAllowed": true
  },
  
  "reminders": [
    {
      "enabled": true,
      "type": "push|email|sms|in-app",
      "timing": "at-time|before|after",
      "offsetMinutes": -30,
      "message": "Time to read! 📖"
    }
  ],
  
  "context": {
    "motivation": "Expand knowledge and relax before sleep",
    "importanceLevel": 4,
    "obstacles": ["Tired after work", "Phone distractions"],
    "successFactors": ["Book on nightstand", "Phone in other room"]
  },
  
  "metadata": {
    // Feature-specific data
    "genres": ["fiction", "self-help"],
    "currentBook": {
      "title": "Atomic Habits",
      "author": "James Clear",
      "totalPages": 320,
      "currentPage": 45
    }
  }
}
```

**Response (201):**
```json
{
  "goalId": "goal-123",
  "userId": "user-456",
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z",
  "progress": {
    "percentComplete": 0,
    "currentStreak": 0,
    "projectedCompletion": "2024-03-15T00:00:00Z"
  }
}
```

### Get Goals
```yaml
GET /goals
```

**Query Parameters:**
- `type` - Filter by goal type (journal, workout, etc.)
- `pattern` - Filter by pattern (recurring, milestone, etc.)
- `status` - active|paused|completed|archived|all (default: active)
- `category` - Filter by category
- `sort` - createdAt|title|progress|nextDue (default: createdAt)
- `order` - asc|desc (default: desc)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response (200):**
```json
{
  "goals": [
    {
      "goalId": "goal-123",
      "goalType": "reading",
      "goalPattern": "recurring",
      "title": "Read 30 minutes daily",
      "status": "active",
      "target": {
        "metric": "duration",
        "value": 30,
        "unit": "minutes",
        "period": "day"
      },
      "progress": {
        "percentComplete": 75,
        "currentStreak": 14,
        "longestStreak": 21,
        "lastActivityDate": "2024-01-14T22:30:00Z",
        "trend": "stable"
      },
      "nextDue": "2024-01-15T21:00:00Z",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

### Get Single Goal
```yaml
GET /goals/{goalId}
```

**Response (200):**
```json
{
  // Full goal object with all fields
  "goalId": "goal-123",
  "goalType": "reading",
  "goalPattern": "recurring",
  // ... all fields from create request ...
  "progress": {
    "percentComplete": 75,
    "currentStreak": 14,
    "longestStreak": 21,
    "totalAccumulated": 420,  // For milestone goals
    "averageValue": 28.5,     // For all goals
    "successRate": 0.75,
    "periodHistory": [
      {
        "period": "2024-01-14",
        "achieved": true,
        "value": 35
      }
    ],
    "trend": "stable",
    "projectedCompletion": null
  },
  "statistics": {
    "totalActivities": 21,
    "totalValue": 630,
    "bestDay": "Monday",
    "bestTime": "21:00-22:00",
    "averagePerDay": 30
  }
}
```

### Update Goal
```yaml
PUT /goals/{goalId}
```

**Request:**
```json
{
  // Any fields from create request can be updated
  "title": "Read 45 minutes daily",
  "target": {
    "value": 45
  },
  "schedule": {
    "preferredTimes": ["20:00", "21:00"]
  }
}
```

**Response (200):**
```json
{
  // Updated goal object
}
```

### Delete Goal
```yaml
DELETE /goals/{goalId}
```

**Response (200):**
```json
{
  "message": "Goal archived successfully",
  "goalId": "goal-123"
}
```

## Goal Progress Endpoints

### Track Progress
```yaml
POST /goals/{goalId}/track
```

**Request:**
```json
{
  "value": 35,
  "unit": "minutes",
  "activityDate": "2024-01-15T21:30:00Z",
  
  "context": {
    // Temporal
    "timeOfDay": "evening",
    "dayOfWeek": "Monday",
    "isWeekend": false,
    
    // Environmental
    "weather": {
      "condition": "rainy",
      "temperature": 65
    },
    "location": "home",
    
    // Physical/Mental
    "energyLevel": 7,
    "stressLevel": 3,
    "sleepHours": 7.5,
    "mood": "relaxed",
    
    // Activity details
    "difficulty": 2,
    "enjoyment": 8,
    "withOthers": false,
    "notes": "Great chapter on habit stacking"
  },
  
  "attachments": [
    {
      "type": "reference",
      "entityId": "book-note-456",
      "url": "/notes/book-note-456"
    }
  ]
}
```

**Response (200):**
```json
{
  "activityId": "activity-789",
  "goalId": "goal-123",
  "progress": {
    "currentPeriodValue": 35,
    "periodTarget": 30,
    "achieved": true,
    "currentStreak": 15,
    "percentComplete": 116
  },
  "insights": {
    "message": "You're on a 15-day streak! 🔥",
    "milestone": "halfway_to_monthly_record"
  }
}
```

### Get Goal Activities
```yaml
GET /goals/{goalId}/activities
```

**Query Parameters:**
- `startDate` - ISO date
- `endDate` - ISO date
- `page` - Page number
- `limit` - Items per page

**Response (200):**
```json
{
  "activities": [
    {
      "activityId": "activity-789",
      "value": 35,
      "unit": "minutes",
      "activityDate": "2024-01-15T21:30:00Z",
      "achieved": true,
      "context": { ... }
    }
  ],
  "summary": {
    "totalActivities": 21,
    "successRate": 0.75,
    "averageValue": 32,
    "trend": "improving"
  },
  "pagination": { ... }
}
```

### Update Activity
```yaml
PUT /goals/{goalId}/activities/{activityId}
```

**Request:**
```json
{
  "value": 40,  // Correcting the value
  "notes": "Actually read longer than I thought"
}
```

### Delete Activity
```yaml
DELETE /goals/{goalId}/activities/{activityId}
```

## Goal Actions

### Pause Goal
```yaml
POST /goals/{goalId}/pause
```

**Request:**
```json
{
  "reason": "vacation",
  "resumeDate": "2024-02-01"  // Optional
}
```

**Response (200):**
```json
{
  "goalId": "goal-123",
  "status": "paused",
  "pausedAt": "2024-01-15T10:00:00Z",
  "resumeDate": "2024-02-01T00:00:00Z"
}
```

### Resume Goal
```yaml
POST /goals/{goalId}/resume
```

### Complete Goal
```yaml
POST /goals/{goalId}/complete
```

**Request:**
```json
{
  "completionNotes": "Finished reading Atomic Habits!",
  "actualValue": 12500,  // For milestone goals
  "rating": 5,
  "wouldRecommend": true
}
```

## Templates

### Get Goal Templates
```yaml
GET /goals/templates
```

**Query Parameters:**
- `type` - Filter by goal type
- `category` - Filter by category
- `difficulty` - beginner|intermediate|advanced
- `search` - Text search
- `sort` - popular|newest|rating

**Response (200):**
```json
{
  "templates": [
    {
      "templateId": "template-123",
      "name": "Couch to 5K",
      "description": "9-week running program for beginners",
      "goalType": "workout",
      "difficulty": "beginner",
      "duration": 63,  // days
      "popularity": 1523,
      "rating": 4.7,
      "defaultGoal": {
        // Pre-configured goal object
      }
    }
  ]
}
```

### Create Goal from Template
```yaml
POST /goals/from-template
```

**Request:**
```json
{
  "templateId": "template-123",
  "customizations": {
    "title": "My Couch to 5K Journey",
    "startDate": "2024-02-01"
  }
}
```

## Analytics

### Get Goal Statistics
```yaml
GET /goals/{goalId}/stats
```

**Query Parameters:**
- `period` - day|week|month|year|all
- `groupBy` - day|week|month

**Response (200):**
```json
{
  "statistics": {
    "overview": {
      "totalDays": 30,
      "activeDays": 22,
      "successRate": 0.73,
      "currentStreak": 14,
      "averageValue": 32.5
    },
    "patterns": {
      "bestTimeOfDay": "evening",
      "bestDayOfWeek": "Sunday",
      "worstDayOfWeek": "Friday",
      "consistencyScore": 0.82
    },
    "trends": [
      {
        "period": "2024-01",
        "average": 28.5,
        "successRate": 0.65
      },
      {
        "period": "2024-02",
        "average": 35.2,
        "successRate": 0.85
      }
    ],
    "predictions": {
      "nextWeekSuccess": 0.89,
      "monthlyProjection": 28,
      "recommendedAdjustment": {
        "parameter": "target.value",
        "current": 30,
        "suggested": 35,
        "confidence": 0.78
      }
    }
  }
}
```

### Get All Goals Summary
```yaml
GET /goals/summary
```

**Response (200):**
```json
{
  "summary": {
    "totalGoals": 12,
    "activeGoals": 8,
    "completedGoals": 3,
    "overallSuccessRate": 0.72,
    "currentStreaks": {
      "journaling": 45,
      "exercise": 14,
      "reading": 7
    },
    "weeklyProgress": {
      "achieved": 28,
      "target": 35,
      "percentage": 80
    }
  },
  "insights": [
    {
      "type": "correlation",
      "message": "You read 40% more on days you exercise",
      "confidence": 0.85
    },
    {
      "type": "recommendation",
      "message": "Try journaling in the morning - your completion rate is 25% higher",
      "goalId": "goal-456"
    }
  ],
  "upcomingMilestones": [
    {
      "goalId": "goal-123",
      "milestone": "100_day_streak",
      "daysUntil": 3
    }
  ]
}
```

### Export Goal Data
```yaml
POST /goals/export
```

**Request:**
```json
{
  "goalIds": ["goal-123", "goal-456"],  // Optional, defaults to all
  "format": "csv|json|pdf",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "includeActivities": true,
  "includeAnalytics": true
}
```

**Response (202):**
```json
{
  "exportId": "export-789",
  "status": "processing",
  "estimatedTime": 60,
  "message": "Export will be emailed when ready"
}
```

## Cross-Goal Insights

### Get Correlations
```yaml
GET /goals/insights/correlations
```

**Response (200):**
```json
{
  "correlations": [
    {
      "goal1": {
        "goalId": "goal-123",
        "title": "Daily Exercise"
      },
      "goal2": {
        "goalId": "goal-456",
        "title": "8 Hours Sleep"
      },
      "correlation": 0.73,
      "insight": "You sleep better on days you exercise",
      "sampleSize": 45
    }
  ]
}
```

### Get Recommendations
```yaml
GET /goals/insights/recommendations
```

**Response (200):**
```json
{
  "recommendations": [
    {
      "type": "new_goal",
      "title": "Consider adding meditation",
      "reasoning": "Users who journal and exercise often benefit from meditation",
      "confidence": 0.82,
      "suggestedTemplate": "template-789"
    },
    {
      "type": "schedule",
      "goalId": "goal-123",
      "current": "evening",
      "suggested": "morning",
      "reasoning": "Your morning completion rate is 25% higher",
      "expectedImprovement": 0.25
    }
  ]
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid goal configuration",
  "details": {
    "field": "target.value",
    "issue": "Value must be positive"
  },
  "requestId": "req-123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Error Codes
- `GOAL_NOT_FOUND` - Goal does not exist
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User doesn't own this goal
- `VALIDATION_ERROR` - Invalid request data
- `PATTERN_MISMATCH` - Invalid data for goal pattern
- `QUOTA_EXCEEDED` - Too many goals (limit: 50)
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Create Goal | 10/hour |
| Track Progress | 100/hour |
| Update Goal | 30/hour |
| Get Analytics | 60/hour |
| Export Data | 5/day |

## Webhook Events (Future)

```json
{
  "event": "goal.milestone.reached",
  "data": {
    "goalId": "goal-123",
    "userId": "user-456",
    "milestone": "30_day_streak",
    "achievedAt": "2024-01-15T22:00:00Z"
  },
  "timestamp": "2024-01-15T22:00:01Z"
}
```

Events:
- `goal.created`
- `goal.completed`
- `goal.milestone.reached`
- `goal.streak.broken`
- `goal.at_risk` (AI prediction)
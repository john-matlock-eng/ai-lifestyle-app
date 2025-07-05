# AI Lifestyle App - Goal System API Documentation

## Overview

The Goal System API provides comprehensive endpoint support for creating and managing personal goals with five distinct patterns:
- **Quantity**: Track measurable amounts (e.g., "Drink 8 glasses of water daily")
- **Duration**: Track time spent (e.g., "Meditate for 20 minutes daily")
- **Frequency**: Track occurrences (e.g., "Exercise 3 times per week")
- **Binary**: Track yes/no completion (e.g., "Take vitamins daily")
- **Checklist**: Track multiple sub-tasks (e.g., "Complete morning routine")

## Base URL
```
https://api.ai-lifestyle-app.com/v1
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Goal Endpoints

### 1. Create Goal
Creates a new goal for the authenticated user.

**Endpoint**: `POST /goals`

**Request Body**:
```json
{
  "title": "Drink 8 glasses of water daily",
  "description": "Stay hydrated by drinking 8 glasses of water every day",
  "pattern": "quantity",
  "target": {
    "value": 8,
    "unit": "glasses",
    "frequency": "daily"
  },
  "category": "health",
  "visibility": "private",
  "reminder": {
    "enabled": true,
    "times": ["09:00", "13:00", "17:00"]
  },
  "startDate": "2025-01-05",
  "endDate": "2025-12-31"
}
```

**Pattern-Specific Target Examples**:

**Quantity Pattern**:
```json
{
  "target": {
    "value": 10000,
    "unit": "steps",
    "frequency": "daily"
  }
}
```

**Duration Pattern**:
```json
{
  "target": {
    "duration": 30,
    "unit": "minutes",
    "frequency": "daily"
  }
}
```

**Frequency Pattern**:
```json
{
  "target": {
    "count": 3,
    "frequency": "weekly"
  }
}
```

**Binary Pattern**:
```json
{
  "target": {
    "frequency": "daily"
  }
}
```

**Checklist Pattern**:
```json
{
  "target": {
    "items": [
      {"id": "1", "text": "Make bed", "order": 1},
      {"id": "2", "text": "Brush teeth", "order": 2},
      {"id": "3", "text": "Meditate 5 minutes", "order": 3}
    ],
    "frequency": "daily"
  }
}
```

**Response** (201 Created):
```json
{
  "goalId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "title": "Drink 8 glasses of water daily",
  "pattern": "quantity",
  "status": "active",
  "createdAt": "2025-01-05T10:00:00Z",
  "streak": {
    "current": 0,
    "longest": 0,
    "lastActivityDate": null
  }
}
```

### 2. Get Goal
Retrieves a specific goal by ID.

**Endpoint**: `GET /goals/{goalId}`

**Response** (200 OK):
```json
{
  "goalId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "title": "Drink 8 glasses of water daily",
  "description": "Stay hydrated by drinking 8 glasses of water every day",
  "pattern": "quantity",
  "target": {
    "value": 8,
    "unit": "glasses",
    "frequency": "daily"
  },
  "category": "health",
  "visibility": "private",
  "status": "active",
  "progress": {
    "today": {
      "value": 5,
      "percentage": 62.5,
      "remaining": 3
    },
    "week": {
      "average": 7.2,
      "percentage": 90,
      "daysCompleted": 6
    },
    "month": {
      "average": 7.8,
      "percentage": 97.5,
      "daysCompleted": 28
    }
  },
  "streak": {
    "current": 15,
    "longest": 30,
    "lastActivityDate": "2025-01-05"
  },
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-05T08:30:00Z"
}
```

### 3. List Goals
Retrieves all goals for the authenticated user with filtering options.

**Endpoint**: `GET /goals`

**Query Parameters**:
- `status`: Filter by status (active, completed, paused, archived)
- `category`: Filter by category (health, fitness, productivity, etc.)
- `pattern`: Filter by pattern (quantity, duration, frequency, binary, checklist)
- `limit`: Maximum number of results (default: 20, max: 100)
- `nextToken`: Pagination token

**Response** (200 OK):
```json
{
  "goals": [
    {
      "goalId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Drink 8 glasses of water daily",
      "pattern": "quantity",
      "status": "active",
      "category": "health",
      "progress": {
        "today": {
          "percentage": 62.5
        }
      },
      "streak": {
        "current": 15
      },
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ],
  "nextToken": "eyJsYXN0S2V5IjoiLi4uIn0="
}
```

### 4. Update Goal
Updates an existing goal's properties.

**Endpoint**: `PUT /goals/{goalId}`

**Request Body** (all fields optional):
```json
{
  "title": "Drink 10 glasses of water daily",
  "description": "Increased hydration goal",
  "target": {
    "value": 10,
    "unit": "glasses",
    "frequency": "daily"
  },
  "status": "active",
  "category": "health",
  "visibility": "friends",
  "reminder": {
    "enabled": false
  }
}
```

**Response** (200 OK):
```json
{
  "goalId": "550e8400-e29b-41d4-a716-446655440000",
  "updatedAt": "2025-01-05T11:00:00Z"
}
```

### 5. Archive Goal
Archives a goal (soft delete).

**Endpoint**: `DELETE /goals/{goalId}`

**Response** (200 OK):
```json
{
  "goalId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "archived",
  "archivedAt": "2025-01-05T12:00:00Z"
}
```

### 6. Log Activity
Records progress for a goal.

**Endpoint**: `POST /goals/{goalId}/activities`

**Request Body Examples**:

**Quantity Activity**:
```json
{
  "value": 2,
  "unit": "glasses",
  "timestamp": "2025-01-05T14:30:00Z",
  "note": "Had 2 glasses with lunch",
  "context": {
    "location": "office",
    "mood": "focused"
  }
}
```

**Duration Activity**:
```json
{
  "duration": 35,
  "unit": "minutes",
  "timestamp": "2025-01-05T07:00:00Z",
  "note": "Morning yoga session"
}
```

**Binary Activity**:
```json
{
  "completed": true,
  "timestamp": "2025-01-05T08:00:00Z",
  "note": "Took vitamins with breakfast"
}
```

**Checklist Activity**:
```json
{
  "completedItems": ["1", "2"],
  "timestamp": "2025-01-05T07:30:00Z",
  "note": "Completed morning routine partially"
}
```

**Response** (201 Created):
```json
{
  "activityId": "act_123456",
  "goalId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-05T14:30:00Z",
  "progress": {
    "today": {
      "value": 7,
      "percentage": 87.5,
      "remaining": 1
    }
  },
  "streak": {
    "current": 16,
    "extended": true
  }
}
```

### 7. List Activities
Retrieves activity history for a goal.

**Endpoint**: `GET /goals/{goalId}/activities`

**Query Parameters**:
- `startDate`: Filter activities from this date (ISO 8601)
- `endDate`: Filter activities until this date (ISO 8601)
- `limit`: Maximum number of results (default: 50, max: 100)
- `nextToken`: Pagination token

**Response** (200 OK):
```json
{
  "activities": [
    {
      "activityId": "act_123456",
      "timestamp": "2025-01-05T14:30:00Z",
      "value": 2,
      "unit": "glasses",
      "note": "Had 2 glasses with lunch",
      "context": {
        "location": "office",
        "mood": "focused"
      }
    }
  ],
  "summary": {
    "totalActivities": 156,
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-05"
    },
    "aggregates": {
      "total": 35,
      "average": 7,
      "unit": "glasses"
    }
  },
  "nextToken": "eyJsYXN0S2V5IjoiLi4uIn0="
}
```

### 8. Get Progress
Retrieves detailed progress analytics for a goal.

**Endpoint**: `GET /goals/{goalId}/progress`

**Query Parameters**:
- `period`: Analysis period (today, week, month, year, all)
- `timezone`: User's timezone for calculations (default: UTC)

**Response** (200 OK):
```json
{
  "goalId": "550e8400-e29b-41d4-a716-446655440000",
  "period": "month",
  "progress": {
    "current": {
      "value": 218,
      "target": 240,
      "percentage": 90.8,
      "unit": "glasses"
    },
    "trend": {
      "direction": "up",
      "change": 5.2,
      "comparedTo": "lastMonth"
    },
    "distribution": {
      "completed": 28,
      "partial": 2,
      "missed": 1
    },
    "statistics": {
      "average": 7.8,
      "best": 12,
      "consistency": 0.93
    },
    "insights": [
      {
        "type": "positive",
        "message": "You're 93% consistent this month!",
        "metric": "consistency"
      },
      {
        "type": "suggestion",
        "message": "You tend to miss your goal on Mondays. Try setting a reminder.",
        "metric": "pattern"
      }
    ]
  },
  "streak": {
    "current": 15,
    "longest": 30,
    "willBreakAt": "2025-01-06T00:00:00Z"
  },
  "forecast": {
    "onTrackToComplete": true,
    "projectedCompletion": 0.95,
    "recommendedDailyTarget": 8
  }
}
```

## Error Responses

All endpoints use standard HTTP status codes and return errors in a consistent format:

```json
{
  "error": {
    "code": "GOAL_NOT_FOUND",
    "message": "Goal with ID 550e8400-e29b-41d4-a716-446655440000 not found",
    "details": {
      "goalId": "550e8400-e29b-41d4-a716-446655440000"
    }
  },
  "requestId": "req_abc123"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid authentication token |
| FORBIDDEN | 403 | User doesn't have permission to access this resource |
| GOAL_NOT_FOUND | 404 | Requested goal doesn't exist |
| VALIDATION_ERROR | 400 | Request body validation failed |
| GOAL_LIMIT_EXCEEDED | 400 | User has reached maximum goal limit (100) |
| DUPLICATE_ACTIVITY | 409 | Activity already logged for this timestamp |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Rate Limits

- **Standard endpoints**: 100 requests per minute
- **Activity logging**: 300 requests per minute
- **Bulk operations**: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704452400
```

## Best Practices

### 1. Efficient Activity Logging
```javascript
// Bad: Individual requests
for (const activity of activities) {
  await fetch(`/goals/${goalId}/activities`, {
    method: 'POST',
    body: JSON.stringify(activity)
  });
}

// Good: Batch logging (future feature)
await fetch(`/goals/${goalId}/activities/batch`, {
  method: 'POST',
  body: JSON.stringify({ activities })
});
```

### 2. Pagination
Always handle pagination for list operations:
```javascript
async function getAllGoals() {
  let allGoals = [];
  let nextToken = null;
  
  do {
    const response = await fetch(`/goals?limit=50${nextToken ? `&nextToken=${nextToken}` : ''}`);
    const data = await response.json();
    allGoals = allGoals.concat(data.goals);
    nextToken = data.nextToken;
  } while (nextToken);
  
  return allGoals;
}
```

### 3. Caching Strategy
```javascript
// Cache goal details (5 minutes)
const goalCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getGoal(goalId) {
  const cached = goalCache.get(goalId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const response = await fetch(`/goals/${goalId}`);
  const data = await response.json();
  
  goalCache.set(goalId, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}
```

### 4. Error Handling
```javascript
async function createGoal(goalData) {
  try {
    const response = await fetch('/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(goalData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      switch (error.error.code) {
        case 'GOAL_LIMIT_EXCEEDED':
          alert('You have reached the maximum number of goals');
          break;
        case 'VALIDATION_ERROR':
          console.error('Validation errors:', error.error.details);
          break;
        default:
          throw new Error(error.error.message);
      }
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to create goal:', error);
    throw error;
  }
}
```

## SDKs and Tools

### JavaScript/TypeScript SDK
```bash
npm install @ai-lifestyle/goals-sdk
```

```typescript
import { GoalsClient } from '@ai-lifestyle/goals-sdk';

const client = new GoalsClient({
  apiKey: process.env.API_KEY,
  environment: 'production'
});

// Create a goal
const goal = await client.goals.create({
  title: "Drink 8 glasses of water daily",
  pattern: "quantity",
  target: {
    value: 8,
    unit: "glasses",
    frequency: "daily"
  }
});

// Log activity
await client.activities.log(goal.goalId, {
  value: 2,
  unit: "glasses"
});
```

### cURL Examples
```bash
# Create a goal
curl -X POST https://api.ai-lifestyle-app.com/v1/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Exercise 30 minutes daily",
    "pattern": "duration",
    "target": {
      "duration": 30,
      "unit": "minutes",
      "frequency": "daily"
    }
  }'

# Get progress
curl https://api.ai-lifestyle-app.com/v1/goals/$GOAL_ID/progress?period=week \
  -H "Authorization: Bearer $TOKEN"
```

## Webhooks (Coming Soon)

Subscribe to goal events:
- `goal.created`
- `goal.updated`
- `goal.completed`
- `goal.archived`
- `activity.logged`
- `streak.extended`
- `streak.broken`
- `milestone.achieved`

## API Changelog

### v1.0.0 (2025-01-05)
- Initial release with 8 goal endpoints
- Support for 5 goal patterns
- Real-time progress tracking
- Streak calculation
- Activity context and insights

### Upcoming Features
- Bulk activity logging
- Goal templates marketplace
- Social sharing and competitions
- AI-powered recommendations
- Export to PDF/CSV
- Webhooks and real-time updates

---

*API Version: 1.0.0*  
*Last Updated: January 5, 2025*
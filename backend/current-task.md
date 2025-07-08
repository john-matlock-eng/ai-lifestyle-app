# Backend Current Tasks - 🚨 CRITICAL: Fix Contract Violation

## 🚨 CRITICAL BLOCKER: Activity Endpoint Contract Violation
**Status**: ⚠️ URGENT - Frontend Blocked
**Date**: 2025-01-08
**Severity**: CRITICAL - Blocking 60% of frontend tasks

### Issue Description
The frontend team is blocked because the activity logging endpoint is NOT following the OpenAPI contract:

```python
AttributeError: 'LogActivityRequest' object has no attribute 'activityType'
File: /var/task/log_activity/handler.py, line 156
```

### The Problem
**Contract Specifies (camelCase)**:
```json
{
  "value": 12500,
  "unit": "steps",
  "activityType": "completed",    // camelCase ✅
  "activityDate": "2024-01-20",    // camelCase ✅
  "context": { ... }
}
```

**Your Code Expects (snake_case)**:
```python
# This is WRONG - violates contract!
activity_type = request.activity_type  # Should be activityType
activity_date = request.activity_date  # Should be activityDate
```

### Required Fix - DO THIS NOW!

#### 1. Update Pydantic Models
In `src/models/activities.py` or wherever `LogActivityRequest` is defined:

```python
from pydantic import BaseModel, Field

class LogActivityRequest(BaseModel):
    value: float
    unit: str
    activityType: str = Field(alias="activityType")  # Match contract!
    activityDate: Optional[str] = Field(alias="activityDate", default=None)
    location: Optional[ActivityLocation] = None
    context: Optional[ActivityContext] = None
    note: Optional[str] = None
    attachments: Optional[List[ActivityAttachmentRequest]] = None
    source: str = "manual"
    
    class Config:
        # This ensures we accept camelCase from API
        allow_population_by_field_name = True
        # But can use snake_case internally if needed
        by_alias = True
```

#### 2. Update Handler Code
In `log_activity/handler.py`, ensure you're accessing fields correctly:

```python
# If using aliases, access like this:
activity_type = request.activityType  # Use the camelCase field name
activity_date = request.activityDate

# OR if you want snake_case internally:
class LogActivityRequest(BaseModel):
    value: float
    unit: str
    activity_type: str = Field(alias="activityType")  # Maps camelCase to snake_case
    activity_date: Optional[str] = Field(alias="activityDate", default=None)
```

#### 3. Check ALL Other Models
Ensure ALL request/response models match the contract:
- `CreateGoalRequest` - all fields should be camelCase
- `UpdateGoalRequest` - all fields should be camelCase
- `Goal` response model - all fields should be camelCase
- `GoalActivity` response model - all fields should be camelCase

### Impact of This Blocker
- ❌ Frontend cannot log activities (Task 3)
- ❌ Frontend cannot show progress (Task 4) 
- ❌ Frontend cannot show activity history (Task 5)
- ❌ 60% of goal features are unusable

### Testing the Fix
```bash
# Test with camelCase fields as per contract:
curl -X POST https://api.ailifestyle.app/v1/goals/{goalId}/activities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 12500,
    "unit": "steps",
    "activityType": "completed",
    "activityDate": "2024-01-20"
  }'
```

### Deployment Steps
1. Fix the Pydantic models NOW
2. Test locally with camelCase fields
3. Deploy immediately:
   ```bash
   cd backend
   ./scripts/deploy.sh
   ```
4. Notify frontend team immediately

### Contract is LAW! 📜
Remember: The OpenAPI contract is the source of truth. Both frontend and backend MUST follow it exactly. If the contract says camelCase, we use camelCase.

### Other Tasks - ON HOLD
All other optimization and monitoring tasks are ON HOLD until this is fixed.

---

**Priority**: 🔴 CRITICAL - Fix within 1 hour
**Impact**: Frontend completely blocked on activities
**Solution**: Update Pydantic models to match contract

Please fix this immediately and notify the frontend team when deployed.

**Updated**: 2025-01-08 13:30 UTC by PM Agent
# 🚨 URGENT HOTFIX: Lambda Import Error

## Critical Issue
Login/Registration is DOWN due to import error in Lambda.

### Error Details
```
Runtime.ImportModuleError: Unable to import module 'main': 
cannot import name 'GoalValidationError' from 'goals_common' 
(/var/task/goals_common/__init__.py)
```

## Root Cause
The `goals_common/__init__.py` file is missing the `GoalValidationError` export.

## Immediate Fix

### Option 1: Add to goals_common/__init__.py
```python
# goals_common/__init__.py
from .models import Goal, GoalActivity, GoalProgress
from .repository import GoalRepository
from .utils import calculate_progress, validate_goal_pattern
from .errors import (
    GoalNotFoundError, 
    GoalQuotaExceededError,
    GoalValidationError,  # ADD THIS LINE
    InvalidGoalPatternError
)

__all__ = [
    'Goal',
    'GoalActivity', 
    'GoalProgress',
    'GoalRepository',
    'calculate_progress',
    'validate_goal_pattern',
    'GoalNotFoundError',
    'GoalQuotaExceededError',
    'GoalValidationError',  # ADD THIS LINE
    'InvalidGoalPatternError'
]
```

### Option 2: Fix the Import Statement
Find where `GoalValidationError` is being imported and fix the import path:
```python
# Instead of:
from goals_common import GoalValidationError

# Use:
from goals_common.errors import GoalValidationError
```

## Deployment Steps

1. **Find the issue**:
   ```bash
   # Search for GoalValidationError usage
   grep -r "GoalValidationError" backend/
   ```

2. **Apply the fix** (choose one):
   - Add the export to `goals_common/__init__.py`
   - Fix the import statement in the file using it

3. **Test locally**:
   ```bash
   # Run the Lambda handler locally
   python -m pytest backend/handlers/auth/test_handler.py
   ```

4. **Deploy immediately**:
   ```bash
   # Deploy just the Lambda function
   npm run deploy:backend:auth
   ```

## Prevention
- Always test imports after adding shared modules
- Run integration tests before deploying
- Consider using `__all__` in __init__.py files

## Impact
- ❌ All authentication is blocked
- ❌ Users cannot login or register
- ❌ API is effectively down

**Priority**: CRITICAL - Fix and deploy within 10 minutes

---
**Status**: Awaiting hotfix
**Time**: 2025-01-05 16:23 UTC
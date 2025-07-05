# Pull Request: Fix Lambda Import Error

## 🚨 Type: Hotfix

### Summary
Fixes production authentication outage caused by missing error class exports in the `goals_common` module.

### Problem
- Lambda functions were failing to initialize with `ImportError`
- `GoalValidationError` could not be imported from `goals_common`
- This caused 100% authentication failure starting at 16:22 UTC

### Solution
Added all error classes to the `goals_common/__init__.py` file:
- Imported all error classes from `.errors`
- Added them to the `__all__` export list
- Ensures proper module interface

### Testing
Run the included test script to verify imports:
```bash
cd backend
python test_goals_common_imports.py
```

### Files Changed
- `backend/src/goals_common/__init__.py` - Added error class exports
- `backend/test_goals_common_imports.py` - Import verification test

### Deployment
After merge, deploy with Terraform:
```bash
terraform apply -target=module.lambda_auth
```

### Incident Timeline
- **16:22 UTC** - First errors detected
- **16:25 UTC** - Issue identified 
- **16:45 UTC** - Fix implemented and tested
- **[Current]** - Awaiting PR review and deployment

### Prevention
See ADR-005 (PR to follow) for proposed shared module practices to prevent similar issues.

### Checklist
- [x] Fix implemented
- [x] Test script created
- [x] Local testing passed
- [ ] PR reviewed
- [ ] Deployed to production
- [ ] Service verified online
- [ ] Post-mortem completed

---
**Priority**: CRITICAL - Production Down
**Review**: Expedited review requested
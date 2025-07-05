# ⚠️ DOCUMENTATION STATUS - PLEASE READ

## Current Architecture: Enhanced Goal System First

Due to architectural improvements, we are building a **Generic Goal System** that supports all lifestyle features before implementing feature-specific functionality.

## Document Status

### ✅ CURRENT Documents (Use These)

#### Goal System (Primary Focus)
- `docs/features/core/goal-system-design-v2.md` - **Enhanced goal model specification**
- `docs/features/core/goal-system-sprint-plan.md` - **Current implementation plan**
- `docs/features/core/goal-model-analysis.md` - Pattern validation
- `docs/features/core/GOAL-MODEL-SUMMARY.md` - Executive summary
- `docs/adr/ADR-004-enhanced-goal-model.md` - Latest architecture decision

#### Updated Plans
- `pm/active-sprint.md` - Current sprint status with pivot
- `backend/current-task.md` - Goal system tasks for backend
- `frontend/current-task.md` - Goal system tasks for frontend

### ⚠️ UPDATED Documents (Reference with Caution)

These documents have been updated to reference the generic goal system:
- `docs/features/journaling/data-model.md` - Updated to use generic goals
- `docs/features/journaling/api-contract.md` - Goal endpoints deprecated
- `docs/features/journaling/sprint-plan.md` - Timeline adjusted
- `docs/features/journaling/goal-system-integration.md` - Shows integration approach

### 🚫 ARCHIVED Documents (Do Not Use)

- `docs/features/core/ARCHIVED-goal-system-design-v1.md` - Original limited design
- Any references to `JournalingGoal` interface (replaced by generic Goal)
- Original timeline (Weeks 3-8 for journaling)

## Implementation Order

1. **Weeks 1-2**: ✅ Authentication (COMPLETE)
2. **Weeks 3-6**: Generic Goal System (CURRENT FOCUS)
3. **Weeks 7-10**: Journaling Feature (using goal system)
4. **Future**: Other features (all using goal system)

## Key Changes

### Before (Limited)
- Each feature had its own goal system
- Only supported recurring goals
- Limited AI context
- Duplicate code across features

### After (Enhanced)
- One goal system for all features
- Supports 5 goal patterns (recurring, milestone, target, streak, limit)
- Rich context for AI analysis
- Shared infrastructure and UI components

## For Developers

When implementing:
1. **Always** check document headers for update notices
2. **Use** generic goal system for ANY goal-related functionality
3. **Don't** create feature-specific goal models
4. **Reference** `goal-system-design-v2.md` as the source of truth

## Questions?

If you're unsure about any documentation:
1. Check this STATUS file first
2. Look for ⚠️ warning headers in documents
3. Refer to `pm/active-sprint.md` for latest status
4. Ask PM for clarification

---

**Last Updated**: 2025-01-07
**Reason**: Pivot to enhanced goal system architecture
**Impact**: All goal-related code must use generic system
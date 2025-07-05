# ADR-003: Generic Goal System Architecture

**Status**: Accepted  
**Date**: 2025-01-07  
**Decision Makers**: Product Manager, Development Team

## Context

During the journaling feature design, we created a goal system specific to journaling. However, the AI Lifestyle App will have multiple features that require goal tracking:
- Journaling (write daily)
- Fitness (workout 3x/week)
- Nutrition (cook at home 5x/week)
- Reading (30 minutes daily)
- Meditation (10 minutes daily)
- Sleep (8 hours nightly)
- Hydration (8 glasses daily)

Creating separate goal systems for each feature would lead to:
- Code duplication
- Inconsistent user experience
- Difficult cross-feature analytics
- Maintenance nightmare
- Poor scalability

## Decision

We will implement a **generic, extensible goal system** that can support any lifestyle tracking feature, with feature-specific extensions through metadata.

## Rationale

### 1. Unified User Experience
- Single goal dashboard showing all lifestyle goals
- Consistent UI patterns across features
- Unified notification system
- Cross-feature analytics and insights

### 2. Code Reusability
- One set of CRUD endpoints
- Shared progress tracking logic
- Common reminder system
- Unified gamification engine

### 3. Flexibility
- New goal types without schema changes
- Feature-specific data in metadata field
- Customizable validation rules
- Progressive goal structures

### 4. Performance
- Single table for all goals
- Efficient queries with proper indexes
- Shared caching strategy
- Optimized notification system

### 5. Business Value
- Faster feature development
- Easier to add new goal types
- Better user engagement through holistic view
- Premium features across all goal types

## Design Principles

### Core Fields (Generic)
- **Identity**: goalId, userId, goalType
- **Target**: metric, value, unit, period
- **Schedule**: frequency, timing preferences
- **Progress**: streaks, completion tracking
- **Status**: active, paused, completed

### Extension Pattern
```typescript
interface Goal {
  // ... core fields ...
  metadata: Record<string, any>; // Feature-specific data
}
```

### Type Safety
Each feature defines its metadata interface:
```typescript
interface JournalingMetadata {
  prompts?: Prompt[];
  useAiPrompts?: boolean;
}
```

## Consequences

### Positive
- **Consistency**: Unified experience across all features
- **Velocity**: New features can leverage existing goal infrastructure
- **Quality**: Shared code is better tested and optimized
- **Analytics**: Holistic view of user wellness journey
- **Monetization**: Premium goal features work everywhere

### Negative
- **Complexity**: Initial implementation more complex
- **Migration**: Need to refactor journaling-specific design
- **Testing**: More edge cases to consider
- **Documentation**: Need clear guidelines for extensions

### Neutral
- Feature teams must coordinate on goal system changes
- UI components need to be flexible for different goal types
- Analytics become more powerful but complex

## Implementation Plan

### Phase 1: Core System (Week 1)
1. Define generic goal model
2. Create base CRUD operations
3. Implement progress tracking
4. Build notification system

### Phase 2: Feature Adapters (Week 2)
1. Journaling goal adapter
2. Fitness goal adapter
3. Nutrition goal adapter
4. Migration utilities

### Phase 3: UI Components (Week 3)
1. Goal creation wizard (adaptive)
2. Progress visualization components
3. Goal list/grid views
4. Analytics dashboard

## Technical Details

### Database Design
- Single `goals` table for all types
- GSI1: Query by goal type
- GSI2: Query by status
- GSI3: Query by next reminder time

### API Design
- `/goals` - Generic endpoints
- `/goals/types/{type}` - Type-specific operations
- `/goals/templates` - Preset goals
- `/goals/analytics` - Cross-feature insights

### Validation Strategy
```typescript
// Type-specific validators
const validators: Record<GoalType, ValidatorFn> = {
  journal: validateJournalGoal,
  workout: validateWorkoutGoal,
  nutrition: validateNutritionGoal,
};
```

## Success Metrics
- 90% code reuse across goal features
- < 1 week to add new goal type
- Single API call to fetch all user goals
- Consistent 5-star rating for goal UX

## Alternatives Considered

### Option 1: Feature-Specific Goal Systems
- **Pros**: Simpler initial implementation, perfect fit per feature
- **Cons**: Massive duplication, inconsistent UX, hard to maintain

### Option 2: Inheritance-Based System
- **Pros**: Type safety, clear hierarchy
- **Cons**: Rigid structure, hard to extend, deep coupling

### Option 3: Microservices per Feature
- **Pros**: Complete independence, team autonomy
- **Cons**: Complex integration, poor user experience, expensive

## Review Schedule
- 1 month: Assess implementation complexity
- 3 months: Evaluate feature team adoption
- 6 months: Review performance and scalability

## References
- [Goal System Design](/docs/features/core/goal-system-design.md)
- [Original Journaling Design](/docs/features/journaling/data-model.md)
- Industry Examples: Strava, MyFitnessPal, Habitica

## Approval

This ADR supersedes the journaling-specific goal design and establishes the generic goal system as the foundation for all lifestyle tracking features.

**Approved by**: Product Manager  
**Date**: 2025-01-07

# Journaling Feature - Sprint Plan (UPDATED)

## ⚠️ IMPORTANT: Timeline Update
**Note**: This sprint plan has been updated to reflect that the [Generic Goal System](../core/goal-system-sprint-plan.md) will be built FIRST (Weeks 3-6), followed by the journaling feature (Weeks 7-10).

## Sprint Overview
**Duration**: 3 Sprints (6 weeks) → Now 4 weeks
**Start**: Week 7 (After Goal System completion)
**Goal**: Deliver journaling feature using the generic goal system

## Updated Timeline
```
Weeks 1-2: ✅ Authentication (COMPLETE)
Weeks 3-6: Generic Goal System (NEW PREREQUISITE)
Weeks 7-8: Core Journaling (Sprint 1)
Weeks 9-10: AI & Social Features (Sprint 2)
```

## Sprint 1: Core Journaling (Weeks 7-8)

### Backend Tasks

#### Task J-B1: Journal Entry CRUD Operations
**Priority**: P1
**Estimate**: 8 hours (reduced from 10)
**Description**: Implement create, read, update, delete operations for journal entries

**Dependencies**: 
- Generic Goal System ✅
- Can reference goals directly, no need to build goal tracking

**Deliverables**:
- Lambda function for journal entry operations
- DynamoDB table for entries (goals already in separate table)
- Input validation and error handling
- Integration with generic goal tracking
- Unit tests with >80% coverage

#### Task J-B2: Media Upload Support
**Priority**: P2
**Estimate**: 6 hours
**Description**: Handle image and audio uploads for journal entries

**Deliverables**:
- S3 bucket configuration with lifecycle rules
- Presigned URL generation for uploads
- Image thumbnail generation
- Audio file validation

#### Task J-B3: Privacy & Security Layer
**Priority**: P1
**Estimate**: 6 hours (reduced from 8)
**Description**: Implement privacy controls and optional encryption

**Note**: Goal-related privacy handled by generic system

### Frontend Tasks

#### Task J-F1: TipTap Editor Integration
**Priority**: P1
**Estimate**: 10 hours (reduced from 12)
**Description**: Integrate and customize TipTap editor for journaling

**Dependencies**:
- Can use generic goal components for goal selection

**Deliverables**:
- TipTap setup with custom extensions
- Integration with goal selector component
- Markdown import/export
- Auto-save functionality

#### Task J-F2: Entry Management UI
**Priority**: P1
**Estimate**: 8 hours (reduced from 10)
**Description**: Create UI for listing, viewing, and managing entries

**Note**: Goal progress shown using generic goal components

#### Task J-F3: Journal-Specific Components
**Priority**: P1
**Estimate**: 6 hours (reduced from 8)
**Description**: Components specific to journaling

**Deliverables**:
- Mood selector
- Entry tags
- Privacy controls
- Journal-specific views

## Sprint 2: AI & Polish (Weeks 9-10)

### Backend Tasks

#### Task J-B4: AI Integration Service
**Priority**: P1
**Estimate**: 10 hours (reduced from 12)
**Description**: Integrate AWS Bedrock and Comprehend for AI features

**Note**: Can leverage AI patterns from goal system

#### Task J-B5: Journal-Specific Analytics
**Priority**: P2
**Estimate**: 6 hours (reduced from 8)
**Description**: Journal-specific insights beyond goal tracking

**Deliverables**:
- Mood trends
- Theme analysis
- Writing patterns
- Integration with goal analytics

### Frontend Tasks

#### Task J-F4: AI Features UI
**Priority**: P1
**Estimate**: 8 hours (reduced from 10)
**Description**: AI prompt and insight displays

#### Task J-F5: Social Features
**Priority**: P2
**Estimate**: 8 hours
**Description**: Sharing and community features

## Benefits of Building After Goal System

### What We DON'T Need to Build
1. ❌ Goal creation UI - Use generic goal wizard
2. ❌ Progress tracking - Handled by goal system
3. ❌ Streak calculation - Built into goals
4. ❌ Reminders - Generic reminder system
5. ❌ Goal analytics - Provided by goal system

### What We Focus On
1. ✅ Rich text editing experience
2. ✅ Journal-specific AI features
3. ✅ Privacy and sharing controls
4. ✅ Mood and theme tracking
5. ✅ Journal entry organization

### Integration Points

#### Creating a Journal Goal
```typescript
// User clicks "Set Journal Goal" in journal UI
// Opens generic goal wizard with:
<GoalWizard
  goalType="journal"
  presets={JOURNAL_GOAL_PRESETS}
  onComplete={(goal) => {
    // Link to journal feature
    setActiveJournalGoal(goal.goalId);
  }}
/>
```

#### Tracking Progress
```typescript
// When user saves journal entry
const trackJournalEntry = async (entry: JournalEntry) => {
  // Save entry
  await saveJournalEntry(entry);
  
  // Update goal progress automatically
  if (entry.goalId) {
    await trackGoalProgress(entry.goalId, {
      value: 1,
      unit: 'entry',
      context: {
        entryId: entry.entryId,
        wordCount: entry.wordCount,
        mood: entry.mood
      }
    });
  }
};
```

## Revised Resource Allocation

### Sprint 1 (Weeks 7-8)
- Backend: 20 hours (reduced from 24)
- Frontend: 24 hours (reduced from 30)
- Testing: 6 hours (reduced from 8)

### Sprint 2 (Weeks 9-10)
- Backend: 16 hours (reduced from 30)
- Frontend: 16 hours (reduced from 28)
- Testing: 8 hours

**Total**: 90 hours (reduced from 194 hours)
**Savings**: 104 hours by using generic goal system!

## Risk Mitigation

### Reduced Risks
- ✅ Goal system already tested
- ✅ Progress tracking proven
- ✅ Reminder system operational
- ✅ Analytics framework in place

### Remaining Risks
- TipTap learning curve
- AI prompt quality
- Social moderation
- Performance with large entries

## Success Metrics

### Sprint 1
- [ ] Users can create and edit journal entries
- [ ] Entries linked to goals from generic system
- [ ] TipTap editor working smoothly
- [ ] Privacy controls functional

### Sprint 2
- [ ] AI prompts generating value
- [ ] Social sharing working safely
- [ ] Performance <200ms
- [ ] Mobile experience polished

## Key Advantages

By building after the goal system:
1. **Faster Development**: 90 hours vs 194 hours
2. **Better Integration**: Native goal support from day 1
3. **Consistent UX**: Uses same goal patterns as other features
4. **Rich Analytics**: Inherits cross-goal insights
5. **Less Code**: No duplicate goal logic to maintain

---

**Note**: This is a much more focused sprint plan that delivers better value by leveraging the generic goal system infrastructure!
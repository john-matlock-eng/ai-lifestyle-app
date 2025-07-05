# Frontend Current Tasks - 2FA UI + Goal System Planning

## 📅 Current Sprint (Week 2)

### Primary Focus: Complete Authentication UI
1. **CloudFront Deployment** - In progress
2. **2FA Setup Flow** - Ready to implement (backend complete!)
3. **Goal UI Planning** - Start component design

## 🔔 Update: Goal Endpoints Ready!

The PM has added all goal management endpoints to the contract. You can now start planning the UI components for the enhanced goal system.

### New Endpoints Available:
- `GET /goals` - List with filtering and pagination
- `POST /goals` - Create goal (5 patterns!)
- `GET /goals/{goalId}` - Goal details
- `PUT /goals/{goalId}` - Update goal
- `DELETE /goals/{goalId}` - Archive goal
- `POST /goals/{goalId}/activities` - Log activity
- `GET /goals/{goalId}/activities` - Activity history
- `GET /goals/{goalId}/progress` - Progress analytics

## 🎯 Today's Tasks

### 1. Complete 2FA UI Components (Priority: HIGH)
Backend is ready and waiting! Implement:

#### MFA Setup Flow
```tsx
// Components needed:
- MFASetupModal
- QRCodeDisplay
- ManualSecretEntry
- VerificationCodeInput
- BackupCodesDisplay (save/print)
```

#### MFA Login Flow
```tsx
// After regular login, if MFA enabled:
- MFAChallenge component
- 6-digit code input
- Remember device option
- Backup code alternative
```

#### Settings Page
```tsx
// MFA management section:
- Enable/disable 2FA toggle
- Current status display
- Re-generate backup codes
- Disable with password confirmation
```

### 2. CloudFront Deployment (Continue)
- Complete configuration
- Test HTTPS setup
- Configure cache behaviors
- Set up error pages

### 3. Goal UI Component Planning (New!)

Start designing components for the 5 goal patterns:

#### Goal Creation Flow
Think about how to handle different patterns:
1. **Recurring**: "Do X every day/week/month"
2. **Milestone**: "Achieve X total"
3. **Target**: "Reach X by date Y"
4. **Streak**: "Do X for Y consecutive days"
5. **Limit**: "Keep X below Y"

#### Component Architecture
```tsx
// Suggested structure:
- GoalWizard (guides through creation)
  - PatternSelector
  - TargetConfiguration
  - ScheduleSetup (for recurring)
  - ContextBuilder (motivation, obstacles)
  
- GoalCard (list display)
  - ProgressIndicator (varies by pattern)
  - QuickLogButton
  - StatusBadge
  
- GoalDetailView
  - ProgressChart
  - ActivityTimeline
  - InsightsPanel
  - EditActions
  
- ActivityLogger
  - ValueInput
  - ContextCapture (mood, energy, etc.)
  - AttachmentUpload
```

## 📋 Week 3 Frontend Plan

### Monday: 2FA Completion
- Finish all 2FA components
- Integration testing with backend
- Error handling flows

### Tuesday: Goal UI Design
- Create Figma mockups for goal flows
- Design pattern-specific components
- Plan responsive layouts

### Wednesday: Goal Components Start
- Implement PatternSelector
- Create GoalCard component
- Build ProgressIndicator variants

### Thursday: Activity Logging
- Design quick-log experience
- Context capture UI
- Rich activity timeline

### Friday: Testing & Polish
- Cross-browser testing
- Accessibility review
- Performance optimization

## 🎨 Design Considerations

### Goal Pattern UX
Each pattern needs different UI:
- **Recurring**: Calendar view, streak tracking
- **Milestone**: Progress bar, cumulative counter
- **Target**: Countdown, trajectory graph
- **Streak**: Chain visualization, day counter
- **Limit**: Gauge, daily tracking

### Mobile-First
- Quick actions prominent
- Swipe gestures for logging
- Condensed progress views
- Offline capability

### Gamification Elements
- Progress animations
- Milestone celebrations
- Streak fire effects
- Achievement unlocks

## 🔧 Technical Notes

### State Management
Consider goal-specific stores:
```tsx
// Zustand stores:
- useGoalStore (CRUD operations)
- useActivityStore (logging)
- useProgressStore (calculations)
- useInsightsStore (analytics)
```

### Real-time Updates
- Optimistic UI for activity logging
- WebSocket for progress updates
- Background sync for offline

### Performance
- Virtual scrolling for activity lists
- Lazy load progress charts
- Cache progress calculations
- Debounce activity saves

## 📚 Resources

### Contract References
- Goal schemas: See `components/schemas/Goal*` in contract
- Activity context: Rich data model for AI
- Progress types: Pattern-specific calculations

### Design Inspiration
- Habitica (gamification)
- Strava (activity tracking)
- Duolingo (streaks)
- MyFitnessPal (progress)

## ✅ Definition of Done

### For 2FA:
- [ ] All flows implemented
- [ ] Error states handled
- [ ] Accessible (WCAG AA)
- [ ] Mobile responsive
- [ ] Integration tested

### For Goals (This Week):
- [ ] Component architecture defined
- [ ] Figma designs created
- [ ] Pattern selector built
- [ ] Basic goal card ready

## 🚨 Blockers/Questions

Currently unblocked! Backend has:
- ✅ 2FA endpoints ready
- ✅ Goal contract complete
- ✅ Infrastructure deployed

If you need clarification on:
- Goal pattern behaviors
- Activity context requirements
- Progress calculation methods

Check the contract first, then ask PM.

---

**Status**: In Progress - 2FA UI
**Next**: Goal component planning
**Updated**: 2025-01-04 by PM Agent
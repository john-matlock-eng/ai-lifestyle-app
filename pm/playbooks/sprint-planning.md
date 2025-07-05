# Playbook: Sprint Planning

## Purpose
Transform business requirements into an actionable sprint plan. You're conducting the orchestra - deciding what pieces to play and in what order.

## When to Use This Playbook
- Start of each sprint (weekly/bi-weekly)
- When priorities shift significantly
- After completing a major milestone

## Prerequisites
- [ ] Previous sprint's retrospective is complete
- [ ] `docs/project-backlog.md` is up to date
- [ ] All current tasks show completion status

## The Sprint Planning Workflow

### Phase 1: Assess Current State (30 min)

#### Check Agent Status
```bash
# See what's in progress or blocked
grep -A 10 "## 🔄 Completion Report" backend/current-task.md
grep -A 10 "## 🔄 Completion Report" frontend/current-task.md
```

#### Update Sprint Tracker
In `pm/active-sprint.md`, document:
```markdown
## Sprint [NUMBER] - Status
**Date**: [Current Date]
**Velocity Last Sprint**: [X features completed]

### In Progress
- [ ] Feature: [Name] - Backend 80%, Frontend 60%

### Blocked
- [ ] Feature: [Name] - Awaiting [specific thing]

### Completed Since Last Check
- [X] Feature: [Name] - Ready for validation
```

### Phase 2: Prioritize Features (45 min)

#### The DICE Framework
Score each feature 1-5 on:
- **D**ata Safety: Does this protect user data?
- **I**mpact: How many users benefit?
- **C**omplexity: How difficult to implement?
- **E**ffort: How many agent-hours needed?

Formula: `Priority = (Data Safety × 2 + Impact × 2) / (Complexity + Effort)`

#### Priority Levels
- **P0 - Critical**: System broken, fix immediately
- **P1 - Core Sprint**: Must complete this sprint
- **P2 - Stretch Goals**: Complete if time allows
- **P3 - Backlog**: Consider next sprint

#### Document Priorities
Update `docs/project-backlog.md`:
```markdown
## Feature Backlog

### P0 - Critical Issues
None currently 🎉

### P1 - Sprint 5 Targets
1. **Barcode Scanning** (DICE: 3.2)
   - User Story: As a busy parent, I want to scan items into my pantry
   - Contract Complexity: 2 new endpoints, 1 external API
   - Estimated Effort: Backend 8h, Frontend 6h

2. **Expiration Alerts** (DICE: 3.0)
   - User Story: As a home cook, I want notifications before food expires
   - Contract Complexity: 1 new endpoint, 1 background job
   - Estimated Effort: Backend 6h, Frontend 4h

### P2 - Stretch Goals
1. **Meal Planning** (DICE: 2.5)
   - Only if P1 items complete early

### P3 - Future Sprints
1. **Recipe Import** (DICE: 2.0)
2. **Shopping List Generation** (DICE: 1.8)
```

### Phase 3: Decompose Features (1 hour)

For each P1 feature, create a Feature Decomposition:

#### Feature Decomposition Template
```markdown
# Feature: [Name]

## User Story
As a [user type], I want to [action] so that [benefit]

## Acceptance Criteria
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]

## Technical Breakdown

### Data Model Changes
- New fields: [List any]
- New entities: [List any]
- Relationships: [Describe any]

### API Endpoints Needed
1. `POST /path` - Create resource
2. `GET /path/{id}` - Retrieve resource
3. `PUT /path/{id}` - Update resource

### External Integrations
- Service: [Name]
- Purpose: [Why needed]
- Risk: [What could fail]

### UI Components
- View: [List key views]
- Interactions: [Key user actions]
- States: [Loading, error, success, empty]

## Dependencies
- Blocked by: [Nothing | Specific thing]
- Blocks: [Nothing | Other features]

## Risk Assessment
- Technical Risk: [Low|Medium|High] - [Why]
- Data Risk: [Low|Medium|High] - [Why]
- UX Risk: [Low|Medium|High] - [Why]
```

### Phase 4: Resource Allocation (30 min)

#### Agent Capacity Planning
Standard sprint capacity (2 weeks):
- Backend Agent: 40 hours
- Frontend Agent: 40 hours
- Your time (PM): 20 hours

#### Allocation Strategy
```markdown
## Sprint 5 Resource Allocation

### Backend Agent (40h total)
- Barcode Scanning API: 8h
- Expiration Alerts: 6h  
- Bug fixes from Sprint 4: 4h
- Code reviews: 4h
- **Allocated: 22h (55%)**
- **Buffer: 18h (45%)**

### Frontend Agent (40h total)
- Barcode Scanner UI: 6h
- Expiration Alerts UI: 4h
- UI Polish from Sprint 4: 6h
- Component testing: 4h
- **Allocated: 20h (50%)**
- **Buffer: 20h (50%)**

### PM Agent (20h total)
- Contract design: 8h
- Task delegation: 4h
- Validation & testing: 4h
- ADR documentation: 2h
- **Allocated: 18h (90%)**
- **Buffer: 2h (10%)**
```

### Phase 5: Create Sprint Plan (30 min)

Generate `pm/active-sprint.md`:
```markdown
# Sprint 5 Plan
**Duration**: Jan 15-29, 2024
**Theme**: "Smart Pantry Management"

## Goals
1. Ship barcode scanning for quick item entry
2. Implement expiration alerts to reduce waste
3. Maintain >95% uptime and <200ms API response time

## Committed Work (P1)
| Feature | Backend | Frontend | Contract | Status |
|---------|---------|----------|----------|---------|
| Barcode Scanning | 8h | 6h | Ready | Not Started |
| Expiration Alerts | 6h | 4h | Ready | Not Started |

## Stretch Goals (P2)
| Feature | Backend | Frontend | Contract | Status |
|---------|---------|----------|----------|---------|
| Meal Planning | 12h | 8h | Draft | Hold |

## Success Metrics
- [ ] All P1 features deployed to production
- [ ] Contract tests passing at 100%
- [ ] User satisfaction score >4.5/5
- [ ] Zero data integrity issues

## Daily Standup Template
```
Date: [DATE]
- Completed yesterday: [List]
- Working on today: [List]
- Blockers: [List or None]
- Contract changes needed: [List or None]
```
```

## Quality Checklist
Before finalizing the sprint plan:
- [ ] All P1 features have clear acceptance criteria
- [ ] Resource allocation includes appropriate buffer time
- [ ] Dependencies are identified and sequenced correctly
- [ ] Each feature can be completed independently
- [ ] Contract designs exist or are scheduled
- [ ] No single agent is over-allocated

## Anti-Patterns to Avoid
- ❌ Committing to features without contract designs
- ❌ Allocating 100% of agent capacity (no buffer)
- ❌ Multiple features with interdependencies
- ❌ Vague acceptance criteria
- ❌ Ignoring technical debt from previous sprints

## Communication After Planning

### To Backend Agent (via current-task.md)
```markdown
## 📅 Sprint 5 Starting

Your committed work for this sprint:
1. Barcode Scanning API (8h) - Start immediately
2. Expiration Alerts (6h) - Start after barcode API

Please review the contract for both features and report any concerns within 24 hours.
```

### To Frontend Agent (via current-task.md)
```markdown
## 📅 Sprint 5 Starting

Your committed work for this sprint:
1. Barcode Scanner UI (6h) - Can start with mocked API
2. Expiration Alerts UI (4h) - Start after scanner

Please run `npm run generate:api` to get latest types before starting.
```

## Metrics to Track

### During Sprint
- Daily velocity (features in progress vs completed)
- Blocker resolution time
- Contract change frequency

### End of Sprint
- Committed vs delivered
- Average task completion time
- Contract stability score
- Agent clarification requests

---

**Next Steps**: After sprint planning, proceed to `pm/playbooks/contract-design.md` to design APIs for the highest priority features.
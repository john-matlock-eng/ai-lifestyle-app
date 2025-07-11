# Playbook: Task Delegation

## Purpose
Transform contract designs into crystal-clear implementation tasks. This is where you conduct the orchestra - giving each musician their sheet music with precise notations.

**Critical Principle**: Ambiguous instructions are the #1 cause of failure in multi-agent systems. Be explicit, provide examples, and define success clearly.

## When to Use This Playbook
- After contract design is complete and validated
- When breaking down complex features
- When agents request clarification (improve the task)
- During sprint planning for task estimation

## The Task Delegation Workflow

### Phase 1: Task Analysis (20 min)

Before writing any tasks, create a delegation plan:

```markdown
# Delegation Plan: [Feature Name]

## Feature Overview
- Contract Operations: [List operationIds]
- Complexity: [Simple|Medium|Complex]
- External Dependencies: [None|List services]

## Backend Requirements
- [ ] New Lambda function(s): [List]
- [ ] Database changes: [None|Describe]
- [ ] External API integration: [None|Describe]
- [ ] Background jobs: [None|Describe]

## Frontend Requirements
- [ ] New views: [List]
- [ ] New components: [List]
- [ ] State management: [Simple|Complex]
- [ ] Real-time features: [None|Describe]

## Task Sequencing
1. Backend API implementation (can start immediately)
2. Frontend can start with mocked data (parallel)
3. Integration testing (after both complete)
4. Performance optimization (if needed)

## Risk Areas
- Technical: [What could be difficult]
- Integration: [Where agents might misalign]
- Performance: [Potential bottlenecks]
```

### Phase 2: Backend Task Creation (30 min)

#### The Anatomy of a Perfect Backend Task

```markdown
# CURRENT TASK: [Verb + Specific Feature]

## 📋 Task Overview
- **Priority**: [P0|P1|P2|P3]
- **Contract Reference**: Operation `[operationId]` in `contract/openapi.yaml`
- **Estimated Effort**: [X hours]
- **Dependencies**: [Specific resources that must exist]

## 🎯 Specific Requirements

### 1. Lambda Function Structure
[Exact directory structure and files needed]

### 2. Business Logic Requirements
[Step-by-step algorithm or flow]

### 3. Data Access Patterns
[Specific queries and indexes to use]

### 4. Error Handling Matrix
[Table of scenarios and responses]

### 5. Infrastructure Configuration
[Terraform module configuration]

### 6. Testing Requirements
[Specific test cases and coverage targets]

## ✅ Definition of Done
[Checklist of completion criteria]

## ⚠️ Important Constraints
[What NOT to do - prevents scope creep]
```

#### Example: Simple CRUD Task

```markdown
# CURRENT TASK: Implement Get User Meals Endpoint

## 📋 Task Overview
- **Priority**: P1
- **Contract Reference**: Operation `getUserMeals` in `contract/openapi.yaml`
- **Estimated Effort**: 4 hours
- **Dependencies**: DynamoDB table `meals-table` exists with GSI `user-meals-index`

## 🎯 Specific Requirements

### 1. Lambda Function Structure
Create `backend/src/get_user_meals/` with:
```
get_user_meals/
├── handler.py       # Lambda entry point
├── controller.py    # HTTP request/response
├── use_case.py     # Business logic
├── repository.py   # Data access interface
├── models.py       # Pydantic models
└── tests/
    ├── test_use_case.py
    └── test_integration.py
```

### 2. Business Logic Requirements
The use case must:
1. Validate pagination parameters (limit/offset)
2. Ensure user can only access their own meals
3. Query meals using GSI `user-meals-index`
4. Sort by `consumedAt` DESC (most recent first)
5. Return total count for pagination
6. Filter by optional date range if provided

### 3. Data Access Patterns
```python
# Repository interface
class MealRepository(ABC):
    async def get_user_meals(
        self,
        user_id: str,
        limit: int,
        offset: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Tuple[List[Meal], int]:
        """Returns (meals, total_count)"""
```

Use DynamoDB query:
- Index: `user-meals-index`
- Partition key: `userId`
- Sort key: `consumedAt` (DESC)
- Projection: ALL

### 4. Error Handling Matrix

| Scenario | Status | Error Code | Response |
|----------|---------|------------|----------|
| Invalid limit (>100) | 400 | INVALID_LIMIT | "Limit must be between 1 and 100" |
| Invalid date range | 400 | INVALID_DATE_RANGE | "Start date must be before end date" |
| User not found | 200 | - | Empty list (not an error) |
| DynamoDB error | 500 | INTERNAL_ERROR | "Unable to retrieve meals" |

### 5. Infrastructure Configuration

In `backend/terraform/services/get_user_meals.tf`:
```hcl
module "get_user_meals" {
  source = "../modules/generic-lambda-service"
  
  function_name = "get_user_meals"
  handler      = "handler.lambda_handler"
  runtime      = "python3.11"
  memory_size  = 256
  timeout      = 10
  
  environment_variables = {
    MEALS_TABLE_NAME = var.meals_table_name
    MEALS_INDEX_NAME = "user-meals-index"
  }
  
  api_gateway_config = {
    path        = "/nutrition/meals"
    http_method = "GET"
  }
  
  iam_policy_statements = [
    {
      effect = "Allow"
      actions = ["dynamodb:Query"]
      resources = [
        var.meals_table_arn,
        "${var.meals_table_arn}/index/user-meals-index"
      ]
    }
  ]
}
```

### 6. Testing Requirements

**Unit Tests** (mock repository):
- Valid request with pagination
- Date range filtering
- Empty results handling
- Boundary conditions (limit=1, limit=100)
- Invalid parameter handling

**Integration Tests** (real DynamoDB):
```python
@pytest.mark.integration
async def test_pagination_accuracy():
    # Insert 25 test meals
    # Query with limit=10, offset=0 - verify 10 results
    # Query with limit=10, offset=10 - verify 10 results  
    # Query with limit=10, offset=20 - verify 5 results
    # Verify total_count is always 25
```

## ✅ Definition of Done
- [ ] All files created following clean architecture
- [ ] Pydantic models match OpenAPI schema exactly
- [ ] Unit test coverage = 100% for use_case.py
- [ ] Integration tests pass with real DynamoDB
- [ ] Performance: 95% requests < 200ms
- [ ] Terraform applies without errors
- [ ] Manual test returns correct paginated results
- [ ] CloudWatch logs use structured logging

## ⚠️ Important Constraints
1. DO NOT create a new DynamoDB table
2. DO NOT modify the existing GSI
3. DO NOT return meals from other users
4. DO NOT load all meals into memory (use pagination)
5. MUST use the existing `user-meals-index` GSI
```

### Phase 3: Frontend Task Creation (30 min)

#### The Anatomy of a Perfect Frontend Task

```markdown
# CURRENT TASK: [Build/Implement Specific UI Feature]

## 📋 Task Overview
- **Priority**: [P0|P1|P2|P3]
- **Contract Reference**: Consumes `[operationId]` endpoint
- **Design Reference**: [Figma/design link]
- **Estimated Effort**: [X hours]
- **Dependencies**: [Backend endpoint must be deployed | Can use mocked data]

## 🎯 Specific Requirements

### 1. Type Generation
[First step - always generate types]

### 2. Component Architecture  
[Directory structure and component hierarchy]

### 3. State Management
[How data flows through components]

### 4. User Interactions
[All possible user actions and responses]

### 5. Error Handling
[How to handle each error case]

### 6. Responsive Design
[Breakpoint-specific requirements]

### 7. Performance Requirements
[Loading strategies, optimization needs]

## ✅ Definition of Done
[Checklist including tests and accessibility]

## ⚠️ Important Constraints
[Prevent common mistakes]
```

#### Example: Data Display Task

```markdown
# CURRENT TASK: Build Meal History View

## 📋 Task Overview
- **Priority**: P1
- **Contract Reference**: Consumes `getUserMeals` endpoint
- **Design Reference**: [Figma - Meal History](https://figma.com/...)
- **Estimated Effort**: 6 hours
- **Dependencies**: Can start with mocked data

## 🎯 Specific Requirements

### 1. Type Generation
```bash
# FIRST ACTION - Run this command:
npm run generate:api
```
This updates `src/api/types.ts` with `GetUserMealsResponse` type.

### 2. Component Architecture
Create feature at `frontend/src/features/meal-history/`:
```
meal-history/
├── index.tsx              # Main view component
├── api.ts                # React Query hooks
├── components/
│   ├── MealCard.tsx      # Individual meal display
│   ├── MealFilters.tsx   # Date range, search
│   ├── MealList.tsx      # Virtualized list
│   └── NutritionSummary.tsx # Daily/weekly totals
├── hooks/
│   └── useMealFilters.ts # Filter state management
└── types.ts              # Local UI state types
```

### 3. State Management

```typescript
// api.ts - React Query implementation
export const useMealHistory = (filters: MealFilters) => {
  return useInfiniteQuery({
    queryKey: ['meals', filters],
    queryFn: ({ pageParam = 0 }) => 
      apiClient.get('/nutrition/meals', {
        params: {
          limit: 20,
          offset: pageParam,
          ...filters
        }
      }),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap(p => p.data.items).length;
      return loaded < lastPage.data.total ? loaded : undefined;
    }
  });
};
```

### 4. User Interactions

**Filter Interactions**:
- Date range picker (preset: Today, Week, Month, All)
- Clear filters button
- Filters persist in URL params

**List Interactions**:
- Infinite scroll (load more on scroll)
- Pull to refresh on mobile
- Click meal → Navigate to detail view
- Long press → Quick actions menu

**Empty States**:
- No meals yet → "Start tracking your meals" CTA
- No results for filter → "No meals found" + clear filters
- Loading → Skeleton cards (3-5 visible)
- Error → Retry button with helpful message

### 5. Error Handling

Map backend errors to user messages:
```typescript
const ERROR_MESSAGES = {
  NETWORK_ERROR: "Unable to load meals. Check your connection.",
  UNAUTHORIZED: "Please log in to view your meal history.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};

// In component
if (error) {
  return (
    <ErrorState 
      message={ERROR_MESSAGES[error.code] || ERROR_MESSAGES.SERVER_ERROR}
      onRetry={() => refetch()}
    />
  );
}
```

### 6. Responsive Design

**Mobile (< 640px)**:
- Single column meal cards
- Sticky filter bar
- Bottom sheet for filters
- Touch-friendly tap targets (min 44px)

**Tablet (640px - 1024px)**:
- 2 column grid
- Sidebar filters
- Hover states on cards

**Desktop (> 1024px)**:
- 3 column grid
- Persistent filter sidebar
- Keyboard shortcuts (/ for search)

### 7. Performance Requirements

- Initial render < 100ms
- Use React.memo for MealCard
- Virtualize list if > 50 items
- Lazy load images
- Debounce filter changes (300ms)
- Cache responses for 5 minutes

## ✅ Definition of Done
- [ ] Types generated from latest OpenAPI spec
- [ ] All components created and typed
- [ ] Infinite scroll working smoothly
- [ ] Filters update URL and persist on refresh
- [ ] All error states handled gracefully
- [ ] Responsive on all breakpoints
- [ ] Accessibility: keyboard navigable, screen reader friendly
- [ ] Tests: >80% coverage, all user flows tested
- [ ] Performance: Lighthouse score >90
- [ ] No console errors or warnings

## ⚠️ Important Constraints
1. DO NOT manually define API response types
2. DO NOT use `any` type anywhere
3. DO NOT make direct fetch calls - use apiClient
4. DO NOT load all meals at once - must paginate
5. REUSE existing design system components
6. MUST handle offline gracefully (show cached data)
```

### Phase 4: Complex Feature Coordination (30 min)

For features requiring tight coordination:

#### Coordination Task Template

```markdown
# FEATURE COORDINATION: [Feature Name]

## Overview
This feature requires coordinated work between Backend and Frontend agents.

## Sequence of Work

### Phase 1: Backend API (Start immediately)
- Task: `backend/current-task.md`
- Deliverable: Working endpoint
- Timeline: 2 days

### Phase 2: Frontend Development (Start with mocks)
- Task: `frontend/current-task.md`  
- Deliverable: UI with mocked data
- Timeline: 2 days (parallel with backend)

### Phase 3: Integration (After both complete)
- [ ] Frontend points to real API
- [ ] End-to-end tests pass
- [ ] Performance validation
- Timeline: 1 day

## Integration Points

### API Contract
- Endpoint: `POST /pantry/items/barcode`
- Request: `BarcodeSearchRequest`
- Response: `PantryItem` | `BarcodeNotFoundError`

### Error Handling Alignment
| Backend Returns | Frontend Shows |
|----------------|----------------|
| 404 BARCODE_NOT_FOUND | "Product not found" + manual entry |
| 503 SERVICE_UNAVAILABLE | "Scanner temporarily offline" + retry |

### Performance Requirements
- Backend: 95% < 2s (includes external API)
- Frontend: Immediate scan feedback
- Timeout: Frontend shows timeout at 3s

## Communication Protocol
1. Backend updates `current-task.md` when endpoint is ready
2. Frontend acknowledges and switches from mock to real
3. Both agents report integration test results
4. PM validates end-to-end flow
```

## Task Quality Checklist

Before finalizing any task, verify:

### Clarity
- [ ] Task has a single, clear objective
- [ ] Success is measurable and specific
- [ ] All technical terms are defined
- [ ] Examples provided for complex logic

### Completeness
- [ ] All edge cases are addressed
- [ ] Error scenarios are specified
- [ ] Performance targets are defined
- [ ] Test cases are comprehensive

### Constraints
- [ ] "Do NOT" sections prevent scope creep
- [ ] Resource limits are specified
- [ ] Dependencies are explicit
- [ ] Existing resources are referenced

### Traceability
- [ ] Links to exact contract sections
- [ ] References to design documents
- [ ] Points to existing code/patterns
- [ ] Includes decision rationale

## Common Delegation Pitfalls

### ❌ Vague Requirements
```markdown
# Bad
"Implement user authentication"

# Good
"Implement JWT validation middleware for the getUserProfile endpoint 
using AWS Cognito User Pool ID from environment variables.
See contract/openapi.yaml line 234 for security scheme definition."
```

### ❌ Missing Context
```markdown
# Bad
"Add caching"

# Good  
"Add Redis caching for product lookup results with 24-hour TTL.
Cache key format: 'product:barcode:{barcode}'.
This reduces OpenFood API calls by ~80% based on usage analysis."
```

### ❌ Assumed Knowledge
```markdown
# Bad
"Use the standard pattern"

# Good
"Follow the repository pattern from backend/src/get_user_profile/
specifically copying the error handling approach in repository.py lines 45-78"
```

## Delegation Success Metrics

Track these for continuous improvement:

1. **Clarification Rate**: Questions per task (Target: <1)
2. **Rework Rate**: Tasks requiring revision (Target: <10%)
3. **Integration Success**: First-time integration success (Target: >90%)
4. **Time Accuracy**: Actual vs estimated hours (Target: ±20%)

## The Delegation Mindset

Remember: You're not just assigning work, you're enabling success. Every task should:

1. **Inspire Confidence**: The agent knows exactly what to build
2. **Prevent Errors**: Constraints and examples guide correct implementation
3. **Enable Autonomy**: No need to ask for clarification
4. **Ensure Alignment**: Contract references keep everyone in sync

---

**Next Steps**: After delegating tasks, monitor progress through completion reports. When work is complete, proceed to `pm/playbooks/validation-testing.md`.
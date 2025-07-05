# Playbook: Validation Testing

## Purpose
Verify that implemented features match the contract exactly and meet quality standards. This is your quality gate - ensuring the orchestra played the piece as written.

**Core Principle**: The contract is law. Any deviation is a bug, regardless of whether it "works better" a different way.

## When to Use This Playbook
- When agents mark tasks as complete
- Before marking features as "Done"
- When integration issues arise
- During sprint review preparation

## The Validation Workflow

### Phase 1: Completion Signal Review (15 min)

#### Check Completion Reports
First, verify agents have properly documented their work:

```bash
# Look for completion reports
grep -A 20 "## 🔄 Completion Report" backend/current-task.md
grep -A 20 "## 🔄 Completion Report" frontend/current-task.md
```

#### Expected Completion Report Format
```markdown
## 🔄 Completion Report
**Status**: ✅ Complete
**Completion Date**: 2024-01-20
**Time Spent**: 7.5 hours

**Deliverables Completed:**
- [x] All required files created
- [x] Tests passing (coverage: 96%)
- [x] Documentation updated
- [x] Manual testing performed

**Technical Decisions:**
- Used composite index for query optimization
- Implemented exponential backoff for external API
- Added request ID for tracing

**Challenges Encountered:**
- DynamoDB hot partition issue → Added jitter to polling
- Rate limit on external API → Implemented caching layer

**Follow-up Required:**
- [ ] Performance optimization if > 1000 requests/minute
- [ ] Add monitoring dashboard
```

### Phase 2: Contract Compliance Testing (30 min)

#### Run Automated Contract Tests

```bash
# 1. Ensure backend is running
cd backend && npm run start:local

# 2. Run contract test suite
cd .. && npm run test:contract -- --verbose

# 3. Generate compliance report
npm run test:contract:report > validation-report.md
```

#### Manual Contract Verification Checklist

For each endpoint implemented:

**1. Request Format Verification**
```bash
# Compare actual vs contract
curl -X POST http://localhost:3000/nutrition/meals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @test-data/create-meal.json \
  -v > actual-request.txt

# Verify against contract
npx openapi-request-validator \
  --spec contract/openapi.yaml \
  --operation createMeal \
  --request actual-request.txt
```

**2. Response Format Verification**
```bash
# Capture actual response
curl -X GET http://localhost:3000/nutrition/meals/123 \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.' > actual-response.json

# Validate against schema
npx openapi-response-validator \
  --spec contract/openapi.yaml \
  --operation getMeal \
  --status 200 \
  --response actual-response.json
```

**3. Error Response Verification**
Test each error case defined in contract:
```bash
# Test 404 response
curl -X GET http://localhost:3000/nutrition/meals/non-existent \
  -H "Authorization: Bearer $TOKEN" \
  -v

# Should return EXACTLY what's in contract:
{
  "error": "RESOURCE_NOT_FOUND",
  "message": "Meal not found",
  "resource": "meal",
  "id": "non-existent"
}
```

### Phase 3: Integration Testing (45 min)

#### End-to-End Test Scenarios

Create test scenarios that exercise the full stack:

```markdown
# E2E Test: Create and Retrieve Meal

## Setup
- User is authenticated
- No existing meals

## Steps
1. Frontend: User fills meal form
2. Frontend: Submits to POST /nutrition/meals
3. Backend: Validates and stores meal
4. Backend: Returns 201 with Location header
5. Frontend: Redirects to meal detail
6. Frontend: Fetches from GET /nutrition/meals/{id}
7. Backend: Returns meal data
8. Frontend: Displays all meal fields

## Verification Points
- [ ] Request matches schema exactly
- [ ] Response includes all required fields
- [ ] Location header points to valid resource
- [ ] Subsequent GET returns identical data
- [ ] UI displays all fields from response
- [ ] No console errors during flow
```

#### Performance Validation

```bash
# Load test configuration
cat > load-test.yaml << EOF
scenarios:
  - name: "Get User Meals"
    request:
      url: "http://localhost:3000/nutrition/meals"
      method: "GET"
      headers:
        Authorization: "Bearer ${TOKEN}"
    load:
      arrivalRate: 10  # 10 requests/second
      duration: 60     # for 60 seconds
    validation:
      - p95: 200       # 95% under 200ms
      - p99: 500       # 99% under 500ms
      - errorRate: 0.1 # <0.1% errors
EOF

# Run load test
artillery run load-test.yaml
```

### Phase 4: Frontend Validation (30 min)

#### Visual Regression Testing

```bash
# Capture UI states
npm run test:visual -- --update-snapshots

# Test scenarios to capture:
# - Empty state
# - Loading state  
# - Error state
# - Single item
# - Multiple items (pagination)
# - Mobile view
# - Tablet view
# - Desktop view
```

#### Accessibility Validation

```bash
# Automated accessibility testing
npm run test:a11y

# Manual checks:
# - [ ] Keyboard navigation works
# - [ ] Screen reader announces properly
# - [ ] Color contrast meets WCAG AA
# - [ ] Focus indicators visible
# - [ ] Error messages are announced
# - [ ] Form labels are associated
```

#### Cross-Browser Testing

Test matrix:
| Browser | Version | Status | Issues |
|---------|---------|---------|---------|
| Chrome | Latest | ✅ | None |
| Firefox | Latest | ✅ | None |
| Safari | Latest | ⚠️ | Date picker styling |
| Edge | Latest | ✅ | None |
| Mobile Safari | iOS 16+ | ✅ | None |
| Chrome Android | Latest | ✅ | None |

### Phase 5: Data Integrity Validation (20 min)

#### Database State Verification

```python
# Script to verify data integrity
import boto3
from datetime import datetime

def verify_meal_data():
    """Ensure all meals have required fields and valid data"""
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('meals-table')
    
    issues = []
    
    # Scan all meals (use pagination in production)
    response = table.scan()
    
    for meal in response['Items']:
        # Check required fields
        required = ['id', 'userId', 'mealType', 'items', 'createdAt']
        for field in required:
            if field not in meal:
                issues.append(f"Meal {meal.get('id')} missing {field}")
        
        # Validate data types
        if 'items' in meal and len(meal['items']) == 0:
            issues.append(f"Meal {meal['id']} has empty items array")
            
        # Check business rules
        if 'consumedAt' in meal:
            consumed = datetime.fromisoformat(meal['consumedAt'])
            if consumed > datetime.now():
                issues.append(f"Meal {meal['id']} has future consumedAt")
    
    return issues

# Run verification
issues = verify_meal_data()
if issues:
    print(f"Found {len(issues)} data integrity issues:")
    for issue in issues:
        print(f"  - {issue}")
else:
    print("✅ All meal data passes integrity checks")
```

### Phase 6: Documentation Validation (15 min)

#### API Documentation
```bash
# Regenerate API docs
npx @redocly/cli build-docs contract/openapi.yaml -o docs/api.html

# Verify examples work
for example in $(find contract/openapi.yaml -name "example"); do
  echo "Testing example: $example"
  # Extract and test each example
done
```

#### README Verification
Each implemented function should have:
- [ ] Purpose clearly stated
- [ ] Environment variables documented
- [ ] Local testing instructions
- [ ] Deployment instructions
- [ ] Monitoring/debugging tips

## Validation Decision Matrix

Based on validation results, take action:

| Result | Action | Next Steps |
|--------|--------|------------|
| ✅ All tests pass | Approve | Mark feature complete |
| ⚠️ Minor issues | Conditional | Create fix tasks |
| ❌ Contract violations | Reject | Return to implementation |
| 🐛 Data integrity issues | Block | Fix before any release |

## Creating Validation Reports

Generate a validation report for each feature:

```markdown
# Validation Report: [Feature Name]
**Date**: 2024-01-20
**Validator**: PM Agent
**Feature**: Meal Tracking API

## Contract Compliance
- [x] Request schemas match exactly
- [x] Response schemas match exactly  
- [x] Error responses follow standards
- [x] All operations implemented

## Test Results
- Unit Tests: 96% coverage, all passing
- Integration Tests: 12/12 passing
- Contract Tests: 48/48 passing
- Load Tests: p95=187ms, p99=423ms ✅
- Visual Tests: No regressions

## Data Integrity
- [x] All required fields present
- [x] No orphaned records
- [x] Referential integrity maintained
- [x] Business rules enforced

## Issues Found
1. **Minor**: Safari date picker has different style
   - Impact: Visual only
   - Action: Created P3 task for next sprint

2. **Minor**: German translation missing for error message
   - Impact: Falls back to English
   - Action: Added to localization backlog

## Sign-off
- [x] Backend implementation approved
- [x] Frontend implementation approved
- [x] Ready for production deployment

**Recommendation**: APPROVED for release
```

## Common Validation Failures

### Contract Mismatches
**Symptom**: Response has extra/missing fields
**Cause**: Implementation drift from contract
**Fix**: Implementation MUST match contract exactly

### Type Mismatches  
**Symptom**: String where number expected
**Cause**: Incorrect type conversion
**Fix**: Ensure Pydantic/TypeScript types match OpenAPI

### Missing Error Handling
**Symptom**: 500 error instead of specific error
**Cause**: Unhandled edge case
**Fix**: Add specific error handler and contract test

### Performance Degradation
**Symptom**: p95 latency exceeds target
**Cause**: Inefficient query or missing index
**Fix**: Profile and optimize, may need ADR

## Validation Automation

Set up CI/CD validation:

```yaml
# .github/workflows/validation.yml
name: Feature Validation

on:
  pull_request:
    types: [ready_for_review]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Contract Tests
        run: npm run test:contract
        
      - name: Integration Tests
        run: npm run test:e2e
        
      - name: Performance Tests
        run: npm run test:performance
        
      - name: Security Scan
        run: npm run security:scan
        
      - name: Generate Report
        run: npm run validation:report
        
      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const report = fs.readFileSync('validation-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

## The Validation Mindset

Remember: You're the guardian of quality. Your role is to:

1. **Protect the Contract**: Any deviation weakens the system
2. **Ensure User Safety**: Data integrity is paramount
3. **Maintain Standards**: Today's shortcut is tomorrow's tech debt
4. **Document Everything**: Future you will thank present you

---

**Next Steps**: After validation completes, document any architectural decisions in ADRs using `pm/playbooks/adr-writing.md`.
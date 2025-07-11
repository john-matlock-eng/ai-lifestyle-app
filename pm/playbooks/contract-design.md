# Playbook: Contract Design

## Purpose
Transform feature requirements into precise OpenAPI contracts. This contract becomes the single source of truth that all agents follow.

**Remember**: The contract is your baton - it directs every movement of your orchestra.

## When to Use This Playbook
- Before ANY implementation begins
- When adding new features
- When modifying existing endpoints
- When external feedback reveals contract gaps

## The Contract Design Workflow

### Phase 1: Requirements Analysis (30 min)

#### Create Design Document
Before touching `contract/openapi.yaml`, write:

```markdown
# Contract Design: [Feature Name]

## Business Requirements
- User Need: [What problem are we solving]
- Success Metric: [How we measure success]
- User Story: As a [user], I want [goal] so that [benefit]

## Data Analysis
### Input Data
- Source: [User input | System generated | External API]
- Format: [Structure and types]
- Validation: [Rules and constraints]

### Output Data  
- Consumer: [Which UI views need this]
- Format: [What structure serves the UI best]
- Performance: [Latency requirements]

### State Changes
- Creates: [New entities created]
- Updates: [Existing entities modified]
- Deletes: [Entities removed]
- Side Effects: [Emails, notifications, etc.]

## Technical Constraints
- Database: [Existing tables/indexes to use]
- External APIs: [Rate limits, formats]
- Performance: [Max response time]
- Security: [Auth requirements]
```

### Phase 2: API Design (45 min)

#### Step 1: Design the Resource Model
Ask yourself:
- What's the core resource? (noun)
- What operations are needed? (verbs)
- How does it relate to other resources?

#### Step 2: Choose the Right Pattern

**Individual Resource Pattern**
```yaml
/resources/{id}:
  get:    # Retrieve one
  put:    # Full update
  patch:  # Partial update
  delete: # Remove
```

**Collection Pattern**
```yaml
/resources:
  get:  # List with filters
  post: # Create new
```

**Action Pattern** (use sparingly)
```yaml
/resources/{id}/actions/send:
  post: # Perform action
```

**Search Pattern**
```yaml
/resources/search:
  post: # Complex search criteria in body
```

#### Step 3: Write the Contract

Start with the operation:
```yaml
paths:
  /nutrition/meals:
    post:
      operationId: createMeal  # MUST be unique, camelCase
      summary: Log a new meal  # <50 chars
      description: |
        Records a meal with its food items and nutritional information.
        Automatically calculates totals from individual food items.
        
        Business rules:
        - Meal must have at least one food item
        - consumedAt cannot be more than 7 days in the past
        - Total calories are calculated server-side
      tags:
        - Nutrition
      security:
        - bearerAuth: []
```

Define request body:
```yaml
      requestBody:
        required: true
        description: Meal data to create
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateMealRequest'
            examples:
              breakfast:
                summary: Simple breakfast
                value:
                  mealType: breakfast
                  consumedAt: "2024-01-15T08:30:00Z"
                  items:
                    - foodId: "123e4567-e89b-12d3-a456-426614174000"
                      quantity: 2
                      unit: "pieces"
```

Define all responses:
```yaml
      responses:
        '201':
          description: Meal created successfully
          headers:
            Location:
              description: URL of created meal
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Meal'
        '400':
          description: Invalid meal data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
              examples:
                missingItems:
                  summary: No food items
                  value:
                    error: "VALIDATION_ERROR"
                    message: "Meal must contain at least one food item"
                    field: "items"
        '422':
          description: Business rule violation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BusinessRuleError'
```

### Phase 3: Schema Design (45 min)

#### Schema Design Principles

1. **Be Explicit**
```yaml
# Bad - ambiguous
amount:
  type: number

# Good - clear constraints
amount:
  type: number
  format: double
  minimum: 0
  maximum: 999999.99
  description: Amount in user's preferred currency
```

2. **Use Consistent Patterns**
```yaml
# Timestamps - always ISO 8601
createdAt:
  type: string
  format: date-time
  description: When the record was created
  example: "2024-01-15T14:30:00Z"

# IDs - always UUIDs
userId:
  type: string
  format: uuid
  description: Unique user identifier
  example: "123e4567-e89b-12d3-a456-426614174000"

# Enums - always lowercase
status:
  type: string
  enum: [active, inactive, pending]
  description: Current status
```

3. **Design for Evolution**
```yaml
# Good - extensible
Meal:
  type: object
  required: [id, userId, mealType, items, createdAt]
  properties:
    # Required fields that will never change
    id:
      type: string
      format: uuid
    # Optional fields for future features
    tags:
      type: array
      items:
        type: string
      description: User-defined tags (future feature)
  additionalProperties: false  # Prevent random fields
```

4. **Shared Schema Components**
```yaml
components:
  schemas:
    # Base schemas for reuse
    ResourceId:
      type: string
      format: uuid
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    
    Timestamp:
      type: string
      format: date-time
      
    # Composed schemas
    Meal:
      allOf:
        - $ref: '#/components/schemas/BaseResource'
        - type: object
          required: [mealType, items]
          properties:
            mealType:
              $ref: '#/components/schemas/MealType'
```

### Phase 4: Validation & Testing (30 min)

#### Automated Validation
```bash
# 1. Syntax validation
npx @apidevtools/swagger-cli validate contract/openapi.yaml

# 2. Best practices linting
npx @redocly/openapi-cli lint contract/openapi.yaml

# 3. Ensure it bundles correctly
npx @apidevtools/swagger-cli bundle contract/openapi.yaml -o test-bundle.yaml

# 4. Check TypeScript generation works
npx openapi-typescript contract/openapi.yaml --output test-types.ts
```

#### Manual Review Checklist
- [ ] Every endpoint has a unique `operationId`
- [ ] All possible error responses are documented
- [ ] Examples are provided for complex schemas
- [ ] Descriptions explain business rules
- [ ] Required vs optional fields make sense
- [ ] No breaking changes to existing endpoints
- [ ] Pagination on all list endpoints
- [ ] Consistent naming conventions
- [ ] Security defined for protected endpoints

### Phase 5: Communication (15 min)

#### Commit the Contract
```bash
git add contract/openapi.yaml
git commit -m "feat(contract): Add meal tracking endpoints

- POST /nutrition/meals - Create new meal entry
- GET /nutrition/meals/{id} - Retrieve specific meal
- GET /nutrition/meals - List meals with pagination
- Includes full nutritional calculation

Refs: #123"
```

#### Document for Agents
In the task delegation, reference specific parts:
```markdown
## Contract References
- Operation: `createMeal` (line 245 in openapi.yaml)
- Request Schema: `CreateMealRequest` (line 1893)
- Response Schema: `Meal` (line 1920)
- Error Schemas: `ValidationError`, `BusinessRuleError`

Note: The contract includes detailed examples in the `examples` section.
```

## Common Contract Patterns

### Pagination Pattern
```yaml
parameters:
  - $ref: '#/components/parameters/limitParam'
  - $ref: '#/components/parameters/offsetParam'
  - $ref: '#/components/parameters/sortParam'

# In components/parameters:
limitParam:
  name: limit
  in: query
  description: Maximum items to return
  schema:
    type: integer
    minimum: 1
    maximum: 100
    default: 20

offsetParam:
  name: offset
  in: query
  description: Number of items to skip
  schema:
    type: integer
    minimum: 0
    default: 0
```

### Filter Pattern
```yaml
parameters:
  - name: status
    in: query
    description: Filter by status
    schema:
      type: array
      items:
        type: string
        enum: [active, inactive, pending]
    style: form
    explode: true
  - name: createdAfter
    in: query
    description: Filter by creation date
    schema:
      type: string
      format: date-time
```

### Batch Operation Pattern
```yaml
/resources/batch:
  post:
    operationId: batchUpdateResources
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [operations]
            properties:
              operations:
                type: array
                minItems: 1
                maxItems: 100
                items:
                  type: object
                  required: [id, changes]
                  properties:
                    id:
                      $ref: '#/components/schemas/ResourceId'
                    changes:
                      $ref: '#/components/schemas/ResourceUpdate'
```

## Contract Anti-Patterns

### ❌ Avoid Generic Endpoints
```yaml
# Bad - does too much
/api/process:
  post:
    description: Processes various operations

# Good - specific purpose
/nutrition/meals/{id}/calculate-nutrition:
  post:
    description: Recalculates nutritional totals for a meal
```

### ❌ Avoid Inconsistent Naming
```yaml
# Bad - mixed conventions
/getUserData
/fetch-meals
/pantry_items

# Good - consistent REST patterns  
/users/{id}
/nutrition/meals
/pantry/items
```

### ❌ Avoid Missing Error Cases
```yaml
# Bad - only happy path
responses:
  '200':
    description: Success

# Good - comprehensive
responses:
  '200':
    description: Success
  '400':
    description: Invalid request
  '401':
    description: Unauthorized
  '404':
    description: Not found
  '409':
    description: Conflict
  '500':
    description: Internal error
```

## Testing Your Contract Design

### Create Mock Data
Test your schema design with realistic data:
```json
{
  "mealType": "breakfast",
  "consumedAt": "2024-01-15T08:30:00Z",
  "items": [
    {
      "foodId": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Scrambled Eggs",
      "quantity": 2,
      "unit": "large",
      "nutrition": {
        "calories": 180,
        "protein": 12.6,
        "carbs": 1.2,
        "fat": 12
      }
    }
  ]
}
```

### Validate Against Schema
```bash
# Use a JSON Schema validator
npx ajv validate -s schema.json -d mock-data.json
```

---

**Remember**: The contract is sacred. Once agents begin implementation, changes become expensive. Design thoughtfully, validate thoroughly, and communicate clearly.

**Next Steps**: After designing the contract, proceed to `pm/playbooks/task-delegation.md` to assign implementation work.
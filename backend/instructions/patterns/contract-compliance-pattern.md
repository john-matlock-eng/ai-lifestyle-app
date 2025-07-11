# Contract Compliance Pattern

## Golden Rule: The Contract is Law

The OpenAPI contract (`contract/openapi.yaml`) is the single source of truth for API behavior. Backend implementations must follow the contract exactly - no more, no less.

## Common Violations to Avoid

### 1. Adding Restrictions Not in Contract

**❌ WRONG**: Backend adds validations beyond what contract specifies
```python
# Contract says: category: type: string
# Backend wrongly restricts:
valid_categories = ['fitness', 'nutrition', 'wellness']
if category not in valid_categories:
    raise ValidationError("Invalid category")
```

**✅ CORRECT**: Follow contract exactly
```python
# Contract says: category: type: string
# Backend accepts any string:
category = request.category  # Any string is valid
```

### 2. Making Optional Fields Required

**❌ WRONG**: Backend requires field that's optional in contract
```python
# Contract says field is optional
if not request.description:
    raise ValidationError("Description is required")
```

**✅ CORRECT**: Respect optionality
```python
# Contract says field is optional
description = request.description  # Can be None
```

### 3. Changing Field Types

**❌ WRONG**: Backend expects different type than contract
```python
# Contract says: value: type: number
if not isinstance(value, int):  # Wrong! number includes float
    raise ValidationError("Must be integer")
```

**✅ CORRECT**: Use exact types from contract
```python
# Contract says: value: type: number
if not isinstance(value, (int, float)):  # Correct
    raise ValidationError("Must be number")
```

## Contract Interpretation Rules

### 1. Enums
- **With enum**: `enum: [value1, value2]` - ONLY these values allowed
- **Without enum**: Any value of the specified type is valid

### 2. Descriptions
- Descriptions are documentation, NOT validation rules
- `description: "Goal category (fitness, nutrition, etc.)"` - Examples, not restrictions

### 3. Examples
- `example: "fitness"` - Just an example, not a restriction
- `examples:` section - Sample data, not validation rules

### 4. Patterns
- `pattern: '^#[0-9A-Fa-f]{6}$'` - This IS a validation rule
- Must implement regex validation when pattern is specified

### 5. Min/Max Constraints
- `minLength`, `maxLength`, `minimum`, `maximum` - These ARE validation rules
- Must enforce these constraints

## Validation Checklist

When implementing validation, ask:

1. [ ] Is this constraint explicitly in the contract schema?
2. [ ] Am I adding business rules not specified in contract?
3. [ ] Am I making assumptions about "reasonable" values?
4. [ ] Am I being more restrictive than the contract?

## Examples from Real Issues

### Category Field Issue
```yaml
# Contract:
category:
  type: string
  description: Goal category (fitness, nutrition, wellness, etc.)
```

**Wrong Interpretation**: "etc." means there's a fixed list we should enforce
**Correct Interpretation**: "etc." means there are more possibilities - accept any string

### Date Validation
```yaml
# Contract:
targetDate:
  type: string
  format: date
  description: For milestone/target goals
```

**Wrong Addition**: "Target date must be in the future"
**Correct Approach**: Contract doesn't specify future requirement - accept any valid date

## When to Add Validation

Only add validation beyond contract when:

1. **Security**: Preventing injection, XSS, etc.
2. **System Limits**: Database field size, performance constraints
3. **Data Integrity**: Preventing corruption or inconsistency

Even then, document why you're adding constraints beyond contract.

## Handling Contract Ambiguity

If contract is ambiguous:

1. **Never guess** - Ask PM for clarification
2. **Be permissive** - Accept more rather than less
3. **Document** - Note the ambiguity in code comments
4. **Request contract update** - Ask PM to clarify in contract

## Contract Change Process

If you think contract needs a constraint:

1. **Don't add it in code** - Contract must be updated first
2. **Document the issue** - In completion report
3. **Wait for PM** - They will update contract if needed
4. **Then implement** - Only after contract is updated

## Remember

- Contract defines the API, not your implementation
- Frontend/clients depend on contract being accurate
- Breaking contract = breaking client applications
- When in doubt, follow contract literally

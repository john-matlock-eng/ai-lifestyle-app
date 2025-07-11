# Pydantic v2 Migration Guide

## Overview
This guide covers the key changes from Pydantic v1 to v2 that affect our codebase.

## Key Changes

### 1. Field Validators

#### Pydantic v1
```python
@validator('field_name')
def validate_field(cls, v, values):
    # values is a dict of other field values
    other_field = values.get('other_field')
    return v
```

#### Pydantic v2
```python
# For single field validation (no access to other fields)
@field_validator('field_name')
@classmethod
def validate_field(cls, v):
    return v

# For cross-field validation
@model_validator(mode='after')
def validate_model(self):
    # Access fields as self.field_name
    if self.field1 and self.field2:
        # validation logic
    return self
```

### 2. Model Configuration

#### Pydantic v1
```python
class Config:
    allow_population_by_field_name = True
    use_enum_values = True
```

#### Pydantic v2
```python
model_config = ConfigDict(
    populate_by_name=True,
    use_enum_values=True,
    alias_generator=to_camel  # For automatic camelCase conversion
)
```

### 3. CamelCase Handling

#### Setup
```python
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class MyModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    user_id: str  # JSON: userId
    created_at: datetime  # JSON: createdAt
```

#### Critical Rule
**Always use snake_case in Python code!**
```python
# ✅ CORRECT
user_id = model.user_id
created = model.created_at

# ❌ WRONG - Will cause AttributeError
user_id = model.userId
created = model.createdAt
```

### 4. Model Serialization

#### Pydantic v1
```python
model.dict()  # Returns dict
model.json()  # Returns JSON string
```

#### Pydantic v2
```python
model.model_dump()  # Returns dict
model.model_dump(by_alias=True)  # Returns dict with aliases (camelCase)
model.model_dump_json()  # Returns JSON string
model.model_dump_json(by_alias=True)  # Returns JSON with aliases
```

### 5. Validation Errors

#### Pydantic v1
```python
try:
    Model(**data)
except ValidationError as e:
    errors = e.errors()
```

#### Pydantic v2
```python
try:
    Model(**data)
except ValidationError as e:
    errors = e.errors()  # Same API
    # But structure may differ slightly
```

## Common Patterns

### 1. Request/Response Models
```python
class CreateRequest(BaseModel):
    """API request model with camelCase conversion."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    title: str
    goal_pattern: GoalPattern  # JSON: goalPattern
    start_date: datetime  # JSON: startDate
```

### 2. Cross-Field Validation
```python
class Goal(BaseModel):
    goal_pattern: GoalPattern
    target: GoalTarget
    
    @model_validator(mode='after')
    def validate_consistency(self):
        """Validate target matches pattern."""
        if self.goal_pattern == GoalPattern.RECURRING:
            if not self.target.period:
                raise ValueError("Recurring goals need a period")
        return self
```

### 3. Optional Fields with Defaults
```python
class Model(BaseModel):
    # Simple default
    status: Status = Status.DRAFT
    
    # Factory default for mutable types
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Complex default with factory
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 4. Nested Model Validation
```python
# All models in the hierarchy need the same config
class NestedModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    some_field: str

class ParentModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    nested: NestedModel  # Will also use camelCase
```

## Testing Considerations

### 1. Test Both Formats
```python
def test_model_parsing():
    # Test camelCase input
    data = {"userId": "123", "createdAt": "2024-01-01T00:00:00Z"}
    model = MyModel(**data)
    
    # Access with snake_case
    assert model.user_id == "123"
    
    # Test output is camelCase
    output = model.model_dump(by_alias=True)
    assert "userId" in output
    assert "user_id" not in output
```

### 2. Test Validation
```python
def test_cross_field_validation():
    with pytest.raises(ValueError) as exc:
        Goal(
            goal_pattern=GoalPattern.RECURRING,
            target=GoalTarget(
                # Missing period for recurring goal
                value=100,
                unit="steps"
            )
        )
    assert "period" in str(exc.value)
```

## Migration Checklist

When migrating from v1 to v2:

1. [ ] Update imports: `from pydantic import ConfigDict`
2. [ ] Replace `class Config:` with `model_config = ConfigDict(...)`
3. [ ] Update validators to use `@field_validator` or `@model_validator`
4. [ ] Add `@classmethod` to field validators
5. [ ] Replace `.dict()` with `.model_dump()`
6. [ ] Replace `.json()` with `.model_dump_json()`
7. [ ] Add `by_alias=True` where needed for API responses
8. [ ] Update field access to use snake_case in Python code
9. [ ] Test with both camelCase input and output

## References
- [Pydantic v2 Migration Guide](https://docs.pydantic.dev/latest/migration/)
- [Pydantic Alias Documentation](https://docs.pydantic.dev/latest/concepts/alias/)
- [Pydantic Validators](https://docs.pydantic.dev/latest/concepts/validators/)

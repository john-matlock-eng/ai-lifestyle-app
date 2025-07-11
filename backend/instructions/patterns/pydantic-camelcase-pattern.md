# Pydantic CamelCase Pattern

## Overview
When building APIs that follow REST conventions with camelCase JSON fields, we use Pydantic's `alias_generator` to automatically handle the conversion between camelCase (JSON) and snake_case (Python).

## The Pattern

```python
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel

class MyModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    # Python uses snake_case
    user_id: str
    goal_pattern: str
    created_at: datetime
```

## How It Works

1. **Input (JSON → Python)**:
   - JSON: `{"userId": "123", "goalPattern": "recurring"}`
   - Python: `model.user_id = "123"`, `model.goal_pattern = "recurring"`

2. **Output (Python → JSON)**:
   - Python: `model.user_id = "123"`
   - JSON: `{"userId": "123"}`

## Critical Rule

**ALWAYS access fields using snake_case in Python code!**

```python
# ✅ CORRECT - Use snake_case in Python
goal_type = request_data.goal_pattern
user = request_data.user_id

# ❌ WRONG - Don't use camelCase
goal_type = request_data.goalPattern  # AttributeError!
user = request_data.userId            # AttributeError!
```

## Complete Example

```python
# models.py
class CreateGoalRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    title: str
    goal_pattern: GoalPattern  # Python field name
    target_type: TargetType    # Python field name

# handler.py
def lambda_handler(event, context):
    # Parse request
    body = json.loads(event['body'])
    request_data = CreateGoalRequest(**body)
    
    # Access fields using snake_case
    print(f"Pattern: {request_data.goal_pattern}")  # ✅ CORRECT
    print(f"Pattern: {request_data.goalPattern}")   # ❌ WRONG - AttributeError
    
    # Response will automatically use camelCase
    response = request_data.model_dump_json(by_alias=True)
    # Output: {"title": "...", "goalPattern": "...", "targetType": "..."}
```

## When to Apply This Pattern

Use this pattern for:
- All request models (input from API)
- All response models (output to API)
- Any models that interface with external JSON APIs

## Common Mistakes

1. **Trying to access camelCase attributes**:
   ```python
   # ❌ WRONG
   value = model.targetType  # AttributeError
   
   # ✅ CORRECT
   value = model.target_type
   ```

2. **Forgetting `by_alias=True` when serializing**:
   ```python
   # ❌ WRONG - Will output snake_case
   json_str = model.model_dump_json()
   
   # ✅ CORRECT - Will output camelCase
   json_str = model.model_dump_json(by_alias=True)
   ```

3. **Not applying to nested models**:
   ```python
   # ❌ WRONG - Nested model missing config
   class NestedModel(BaseModel):
       some_field: str
   
   # ✅ CORRECT - All models need the config
   class NestedModel(BaseModel):
       model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
       some_field: str
   ```

## Testing Tips

1. **Test both input and output**:
   ```python
   # Test input parsing
   data = {"userId": "123", "goalPattern": "recurring"}
   model = MyModel(**data)
   assert model.user_id == "123"
   assert model.goal_pattern == "recurring"
   
   # Test output serialization
   output = model.model_dump(by_alias=True)
   assert output["userId"] == "123"
   assert output["goalPattern"] == "recurring"
   ```

2. **Check field access in code**:
   ```python
   # This will catch AttributeError early
   try:
       _ = model.userId  # Should fail
       assert False, "Should have raised AttributeError"
   except AttributeError:
       pass  # Expected
   ```

## Reference
- [Pydantic Alias Documentation](https://docs.pydantic.dev/latest/usage/alias/)
- OpenAPI contract: `contract/openapi.yaml`

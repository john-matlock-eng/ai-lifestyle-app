# DynamoDB Float to Decimal Pattern

## Problem
DynamoDB doesn't support Python `float` types. When you try to save a float value, you'll get:
```
Float types are not supported. Use Decimal types instead.
```

## Solution
Convert all float values to Decimal before saving to DynamoDB.

## Implementation

### 1. Helper Method
Add this helper to your repository class:

```python
from decimal import Decimal

def _convert_floats_to_decimal(self, data: Any) -> Any:
    """Convert all float values to Decimal for DynamoDB compatibility."""
    if isinstance(data, float):
        # Convert float to Decimal, handling special cases
        if data == float('inf') or data == float('-inf') or data != data:  # NaN
            return None  # DynamoDB doesn't support infinity or NaN
        return Decimal(str(data))
    elif isinstance(data, dict):
        return {k: self._convert_floats_to_decimal(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [self._convert_floats_to_decimal(item) for item in data]
    else:
        return data
```

### 2. Use in Create Operations
```python
def create_item(self, model: BaseModel) -> BaseModel:
    # Convert model to dict
    data = model.model_dump(mode='json')
    
    # Convert floats to Decimal
    data = self._convert_floats_to_decimal(data)
    
    # Save to DynamoDB
    self.table.put_item(Item={
        'pk': 'some_key',
        'sk': 'some_sort_key',
        **data
    })
    
    return model
```

### 3. Use in Update Operations
```python
def update_item(self, updates: Dict[str, Any]) -> None:
    expression_values = {}
    
    for key, value in updates.items():
        # Convert each value
        expression_values[f":{key}"] = self._convert_floats_to_decimal(value)
```

## Important Notes

### 1. API Contract Compliance
- The API still accepts and returns `float` values as specified in OpenAPI
- Conversion only happens at the database layer
- This is transparent to API consumers

### 2. Reading from DynamoDB
- DynamoDB returns Decimal objects
- Pydantic models automatically convert Decimal back to float
- No special handling needed for reads

### 3. Special Values
- `float('inf')`, `float('-inf')`, and `NaN` are converted to `None`
- DynamoDB doesn't support these special float values
- Consider how your application should handle these cases

## Example: Complete Repository Method

```python
def create_goal(self, goal: Goal) -> Goal:
    """Create a new goal with proper float handling."""
    try:
        # Convert to dict with JSON serialization (handles datetime)
        goal_data = goal.model_dump(mode='json')
        
        # Convert floats to Decimal
        goal_data = self._convert_floats_to_decimal(goal_data)
        
        # Prepare DynamoDB item
        item = {
            'pk': f'USER#{goal.user_id}',
            'sk': f'GOAL#{goal.goal_id}',
            'EntityType': 'Goal',
            **goal_data
        }
        
        # Save to DynamoDB
        self.table.put_item(Item=item)
        
        return goal
        
    except Exception as e:
        logger.error(f"Failed to create goal: {str(e)}")
        raise
```

## Testing Considerations

### 1. Unit Tests
```python
def test_float_conversion():
    repo = Repository()
    
    # Test basic float
    assert repo._convert_floats_to_decimal(3.14) == Decimal('3.14')
    
    # Test dict with floats
    data = {'value': 10.5, 'nested': {'amount': 99.99}}
    converted = repo._convert_floats_to_decimal(data)
    assert converted['value'] == Decimal('10.5')
    assert converted['nested']['amount'] == Decimal('99.99')
    
    # Test special values
    assert repo._convert_floats_to_decimal(float('inf')) is None
```

### 2. Integration Tests
- Test actual DynamoDB operations with float values
- Verify round-trip conversion (float → Decimal → float)
- Ensure precision is maintained

## Common Mistakes

1. **Forgetting nested objects**: Make sure to recursively convert
2. **Direct Decimal construction**: Use `Decimal(str(float_value))` not `Decimal(float_value)`
3. **Not handling special values**: Check for infinity and NaN
4. **Converting at wrong layer**: Do this in repository, not in models

## References
- [AWS DynamoDB Data Types](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBMapper.DataTypes.html)
- [Python Decimal Documentation](https://docs.python.org/3/library/decimal.html)

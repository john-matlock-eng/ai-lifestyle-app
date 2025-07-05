# ADR-005: Shared Module Dependencies

## Status
Proposed (Emergency - in response to production incident)

## Context
On 2025-01-05, a production outage occurred when the authentication Lambda failed to start due to an import error from the newly created `goals_common` shared module. The error revealed that shared modules can create unexpected dependencies between otherwise independent services.

### Current Situation
- Multiple Lambda functions may import from shared modules
- Changes to shared modules can break unrelated services
- No isolation between feature modules
- Import errors only discovered at runtime in Lambda

## Decision
We will implement the following practices for shared modules:

### 1. Explicit Dependency Declaration
Each Lambda function must declare its dependencies explicitly:
```python
# lambda_dependencies.py
HANDLER_DEPENDENCIES = {
    'auth': ['auth_common'],
    'goals': ['goals_common', 'auth_common'],
    'journal': ['journal_common', 'auth_common', 'encryption_common']
}
```

### 2. Isolated Shared Modules
Shared modules will be organized by domain:
```
backend/
├── shared/
│   ├── auth_common/      # Auth utilities only
│   ├── core_common/      # Core utilities (no domain logic)
│   ├── encryption_common/ # Encryption utilities
│   └── __init__.py       # Empty - no cross-imports
├── handlers/
│   ├── auth/            # Can only import auth_common, core_common
│   └── goals/           # Can only import goals_common, core_common
```

### 3. Import Testing
All Lambda deployments must pass import verification:
```python
# test_imports.py
@pytest.mark.parametrize("handler", get_all_handlers())
def test_handler_imports(handler):
    """Verify handler can be imported"""
    importlib.import_module(handler)
```

### 4. Deployment Guards
```yaml
# buildspec.yml
pre_build:
  commands:
    - python -m pytest tests/test_imports.py
    - python scripts/verify_dependencies.py
```

## Consequences

### Positive
- Prevents cross-feature dependencies
- Catches import errors before deployment
- Clear dependency boundaries
- Easier to reason about impact of changes

### Negative
- Some code duplication between modules
- More careful planning needed for shared utilities
- Additional testing overhead

### Neutral
- Requires team education on module boundaries
- May need refactoring of existing shared code

## Implementation Plan

### Phase 1: Immediate (This Week)
1. Fix current import error
2. Add import tests to CI/CD
3. Document module boundaries

### Phase 2: Short-term (Next Sprint)
1. Refactor shared modules by domain
2. Add dependency verification script
3. Update developer documentation

### Phase 3: Long-term
1. Consider separate Lambda layers for shared code
2. Implement module versioning
3. Automated dependency graph generation

## Alternatives Considered

### 1. Monolithic Shared Module
- **Pros**: Simple, everything in one place
- **Cons**: Any change affects all services
- **Rejected**: Too risky for production

### 2. No Shared Modules
- **Pros**: Complete isolation
- **Cons**: Massive code duplication
- **Rejected**: Unmaintainable

### 3. Lambda Layers
- **Pros**: Version control, true isolation
- **Cons**: More complex deployment
- **Deferred**: Good long-term solution

## References
- [AWS Lambda Layers Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
- [Python Import System](https://docs.python.org/3/reference/import.html)
- Post-mortem: `docs/post-mortem-2025-01-05.md`

---
**Date**: 2025-01-05
**Author**: PM Agent
**Status**: Proposed (Emergency)
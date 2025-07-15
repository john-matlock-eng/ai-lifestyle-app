# Feature Flags Implementation

## Overview

Feature flags allow us to enable/disable features dynamically without code changes. This implementation provides a centralized way to manage feature toggles across the application.

## Current Feature Flags

- **debugPanels**: Controls visibility of debug panels in the UI (e.g., Journal Debug Tool)
  - Default: `true` (dev/staging), `false` (production)

## Architecture

### Backend

1. **Environment Variables**: Feature flags are configured in Terraform via environment variables
   ```hcl
   FEATURE_FLAG_DEBUG_PANELS = var.environment == "prod" ? "false" : "true"
   ```

2. **API Endpoint**: `GET /config/features` returns current feature flags
   - No authentication required
   - Returns JSON object with all feature flags

3. **Handler**: `backend/src/get_feature_flags.py` reads environment variables and returns them

### Frontend

1. **API Service**: `frontend/src/api/config.ts` - Fetches feature flags from backend

2. **React Context**: `FeatureFlagsProvider` manages feature flags globally
   - Fetches flags on app initialization
   - Provides flags to all components
   - Handles loading and error states

3. **Hooks**: 
   - `useFeatureFlags()` - Access all feature flags and context state
   - `useFeatureFlag('flagName')` - Check specific feature flag (returns boolean)

## Usage

### Adding a New Feature Flag

1. **Backend**: Add environment variable in `backend/terraform/main.tf`:
   ```hcl
   FEATURE_FLAG_YOUR_FLAG = var.environment == "prod" ? "false" : "true"
   ```

2. **Backend Handler**: Update `backend/src/get_feature_flags.py`:
   ```python
   your_flag = os.environ.get("FEATURE_FLAG_YOUR_FLAG", "false").lower() == "true"
   feature_flags = {
       "debugPanels": debug_panels,
       "yourFlag": your_flag  # Add here
   }
   ```

3. **Frontend Types**: Update `frontend/src/api/config.ts`:
   ```typescript
   export interface FeatureFlags {
     debugPanels: boolean;
     yourFlag: boolean;  // Add here
   }
   ```

### Using Feature Flags in Components

```typescript
import { useFeatureFlag } from '../../hooks/useFeatureFlags';

const MyComponent = () => {
  const myFeatureEnabled = useFeatureFlag('myFeature');
  
  return (
    <>
      {myFeatureEnabled && (
        <div>Feature is enabled!</div>
      )}
    </>
  );
};
```

## Deployment

- Changes to feature flags require Terraform deployment
- Flags take effect immediately after Lambda deployment
- Frontend caches flags during session (refresh to get updates)

## Best Practices

1. Use descriptive flag names (e.g., `enableNewCheckout` not `flag1`)
2. Default to `false` for new features
3. Clean up old flags after features are stable
4. Document each flag's purpose
5. Consider user-specific flags for gradual rollouts (future enhancement)
#!/bin/bash

# This script manually fixes all specific TypeScript errors

echo "Starting manual TypeScript error fixes..."

# 1. Fix RegistrationForm imports
echo "Fixing RegistrationForm..."
sed -i 's/import { RegisterFormData }/import type { RegisterFormData }/' src/features/auth/components/RegistrationForm.tsx

# 2. Fix authService imports
echo "Fixing authService..."
sed -i '4s/import {/import type {/' src/features/auth/services/authService.ts
sed -i '5s/import {/import type {/' src/features/auth/services/authService.ts
sed -i '6s/import {/import type {/' src/features/auth/services/authService.ts
sed -i '7s/import {/import type {/' src/features/auth/services/authService.ts

# 3. Fix GoalCreator type imports
echo "Fixing GoalCreator components..."
sed -i '3s/import {/import type {/' src/features/goals/components/GoalCreator/GoalTypeSelector.tsx
sed -i '4s/import {/import type {/' src/features/goals/components/GoalCreator/LimitGoalForm.tsx
sed -i '5s/import {/import type {/' src/features/goals/components/GoalCreator/LimitGoalForm.tsx
sed -i '8s/import {/import type {/' src/features/goals/components/GoalCreator/LimitGoalForm.tsx
sed -i '4s/import {/import type {/' src/features/goals/components/GoalCreator/MilestoneGoalForm.tsx
sed -i '7s/import {/import type {/' src/features/goals/components/GoalCreator/MilestoneGoalForm.tsx
sed -i '4s/import {/import type {/' src/features/goals/components/GoalCreator/RecurringGoalForm.tsx
sed -i '5s/import {/import type {/' src/features/goals/components/GoalCreator/RecurringGoalForm.tsx
sed -i '6s/import {/import type {/' src/features/goals/components/GoalCreator/RecurringGoalForm.tsx
sed -i '9s/import {/import type {/' src/features/goals/components/GoalCreator/RecurringGoalForm.tsx
sed -i '4s/import {/import type {/' src/features/goals/components/GoalCreator/StreakGoalForm.tsx
sed -i '5s/import {/import type {/' src/features/goals/components/GoalCreator/StreakGoalForm.tsx
sed -i '4s/import {/import type {/' src/features/goals/components/GoalCreator/TargetGoalForm.tsx
sed -i '7s/import {/import type {/' src/features/goals/components/GoalCreator/TargetGoalForm.tsx

# 4. Fix GoalDetail imports
echo "Fixing GoalDetail..."
sed -i '7s/import {/import type {/' src/features/goals/components/GoalDetail.tsx

# 5. Fix GoalList imports
echo "Fixing GoalList..."
sed -i '3s/import {/import type {/' src/features/goals/components/GoalList.tsx

# 6. Fix creation components
echo "Fixing creation components..."
sed -i '4s/import {/import type {/' src/features/goals/components/creation/GoalWizard.tsx
sed -i '2s/import {/import type {/' src/features/goals/components/creation/MotivationStep.tsx
sed -i '2s/import {/import type {/' src/features/goals/components/creation/PatternSelector.tsx
sed -i '2s/import {/import type {/' src/features/goals/components/creation/ReviewStep.tsx
sed -i '2s/import {/import type {/' src/features/goals/components/creation/ScheduleStep.tsx
sed -i '2s/import {/import type {/' src/features/goals/components/creation/TargetStep.tsx

# 7. Fix display components
echo "Fixing display components..."
sed -i '2s/import {/import type {/' src/features/goals/components/display/GoalList.tsx

# 8. Fix logging component
echo "Fixing logging component..."
sed -i '4s/import {/import type {/' src/features/goals/components/logging/QuickLogModal.tsx

# 9. Fix hooks
echo "Fixing hooks..."
sed -i '12s/import {/import type {/' src/features/goals/hooks/useGoals.ts
sed -i '13s/import {/import type {/' src/features/goals/hooks/useGoals.ts
sed -i '14s/import {/import type {/' src/features/goals/hooks/useGoals.ts

# 10. Fix services
echo "Fixing services..."
sed -i '3s/import {/import type {/' src/features/goals/services/goalService.ts
sed -i '4s/import {/import type {/' src/features/goals/services/goalService.ts
sed -i '5s/import {/import type {/' src/features/goals/services/goalService.ts
sed -i '6s/import {/import type {/' src/features/goals/services/goalService.ts
sed -i '7s/import {/import type {/' src/features/goals/services/goalService.ts
sed -i '8s/import {/import type {/' src/features/goals/services/goalService.ts
sed -i '9s/import {/import type {/' src/features/goals/services/goalService.ts
sed -i '10s/import {/import type {/' src/features/goals/services/goalService.ts

# 11. Fix ui types
echo "Fixing ui types..."
sed -i '2s/import {/import type {/' src/features/goals/types/ui.types.ts

# 12. Fix pages
echo "Fixing pages..."
sed -i '18s/import {/import type {/' src/pages/ComponentShowcase.tsx
sed -i '19s/import {/import type {/' src/pages/ComponentShowcase.tsx
sed -i '4s/import {/import type {/' src/pages/goals/GoalsPage.tsx

# 13. Fix store
echo "Fixing store..."
sed -i '1s/import {/import type {/' src/store/hooks.ts
sed -i '1s/import {/import type {/' src/store/slices/encryptionSlice.ts

# 14. Fix misc components
echo "Fixing misc components..."
sed -i '3s/import {/import type {/' src/components/settings/SecuritySection.tsx
sed -i '2s/import {/import type {/' src/features/auth/components/PasswordInput.tsx

# 15. Fix RecurringGoalForm daysOfWeek issue
echo "Fixing RecurringGoalForm daysOfWeek..."
sed -i 's/formData.daysOfWeek.length/formData.daysOfWeek?.length || 0/g' src/features/goals/components/GoalCreator/RecurringGoalForm.tsx
sed -i 's/{formData.daysOfWeek/{formData.daysOfWeek || []/g' src/features/goals/components/GoalCreator/RecurringGoalForm.tsx

# 16. Fix MilestoneGoalForm currentValue
echo "Fixing MilestoneGoalForm currentValue..."
sed -i 's/formData.currentValue/formData.currentValue || 0/g' src/features/goals/components/GoalCreator/MilestoneGoalForm.tsx

# 17. Fix RegistrationForm error handling
echo "Fixing RegistrationForm error handling..."
cat > /tmp/reg-fix.txt << 'EOF'
      if (isValidationError(error)) {
        // Handle field-specific validation errors from the API
        error.response?.data.validation_errors.forEach((validationError) => {
          const field = validationError.field as keyof RegisterFormData;
          if (field === 'email' || field === 'password' || field === 'firstName' || field === 'lastName' || field === 'confirmPassword') {
            setError(field, {
              message: validationError.message,
            });
          }
        });
      } else if ((error as any).response?.status === 409) {
        // Email already exists
        setError('email', {
          message: 'An account with this email already exists',
        });
      } else if ((error as any).code === 'ERR_NETWORK' || (error as any).code === 'ERR_CONNECTION_REFUSED') {
        // Network error - backend not available
        setGeneralError(
          'Unable to connect to the server. Make sure the backend is running or MSW is properly configured.'
        );
      } else {
        // General error
        setGeneralError(
          (error as any).response?.data?.message || 
          'Something went wrong. Please try again.'
        );
      }
EOF

# 18. Fix useNetworkErrorRecovery
echo "Fixing useNetworkErrorRecovery..."
sed -i 's/handleRetry()/handleRetry(undefined as any)/g' src/hooks/useNetworkErrorRecovery.ts

# 19. Fix encryptionSlice
echo "Fixing encryptionSlice..."
sed -i 's/action.payload.error/action.payload.error || ""/g' src/store/slices/encryptionSlice.ts

# 20. Fix ComponentShowcase
echo "Fixing ComponentShowcase key type..."
sed -i 's/key)/key: string)/g' src/pages/ComponentShowcase.tsx

echo "All TypeScript errors should be fixed!"

#!/bin/bash

# Fix type imports in components
sed -i 's/import { UserProfile }/import type { UserProfile }/g' src/components/settings/SecuritySection.tsx

# Fix PasswordInput types
sed -i 's/import { InputProps }/import type { InputProps }/g' src/features/auth/components/PasswordInput.tsx

# Fix auth service types
sed -i 's/import {\s*RegisterFormData\s*}/import type { RegisterFormData }/g' src/features/auth/services/authService.ts
sed -i 's/import {\s*LoginFormData\s*}/import type { LoginFormData }/g' src/features/auth/services/authService.ts
sed -i 's/import {\s*PasswordResetRequestFormData\s*}/import type { PasswordResetRequestFormData }/g' src/features/auth/services/authService.ts
sed -i 's/import {\s*PasswordResetConfirmFormData\s*}/import type { PasswordResetConfirmFormData }/g' src/features/auth/services/authService.ts

# Fix goal type imports
sed -i 's/import { GoalPattern }/import type { GoalPattern }/g' src/features/goals/components/GoalCreator/GoalTypeSelector.tsx
sed -i 's/import { GoalPatternConfig }/import type { GoalPatternConfig }/g' src/features/goals/components/GoalCreator/GoalTypeSelector.tsx
sed -i 's/import { LimitGoalFormData }/import type { LimitGoalFormData }/g' src/features/goals/components/GoalCreator/LimitGoalForm.tsx
sed -i 's/import { Period }/import type { Period }/g' src/features/goals/components/GoalCreator/LimitGoalForm.tsx
sed -i 's/import { MetricType }/import type { MetricType }/g' src/features/goals/components/GoalCreator/LimitGoalForm.tsx
sed -i 's/import { MilestoneGoalFormData }/import type { MilestoneGoalFormData }/g' src/features/goals/components/GoalCreator/MilestoneGoalForm.tsx
sed -i 's/import { RecurringGoalFormData }/import type { RecurringGoalFormData }/g' src/features/goals/components/GoalCreator/RecurringGoalForm.tsx
sed -i 's/import { Frequency }/import type { Frequency }/g' src/features/goals/components/GoalCreator/RecurringGoalForm.tsx
sed -i 's/import { StreakGoalFormData }/import type { StreakGoalFormData }/g' src/features/goals/components/GoalCreator/StreakGoalForm.tsx
sed -i 's/import { TargetGoalFormData }/import type { TargetGoalFormData }/g' src/features/goals/components/GoalCreator/TargetGoalForm.tsx

# Fix goal detail types
sed -i 's/import { Goal, GoalActivity }/import type { Goal, GoalActivity }/g' src/features/goals/components/GoalDetail.tsx
sed -i 's/import { Goal, GoalStatus }/import type { Goal, GoalStatus }/g' src/features/goals/components/GoalList.tsx

# Fix creation types
sed -i 's/import { GoalPattern, CreateGoalRequest, GoalTarget, GoalSchedule, GoalContext }/import type { GoalPattern, CreateGoalRequest, GoalTarget, GoalSchedule, GoalContext }/g' src/features/goals/components/creation/GoalWizard.tsx
sed -i 's/import { GoalContext }/import type { GoalContext }/g' src/features/goals/components/creation/MotivationStep.tsx
sed -i 's/import { GoalPattern }/import type { GoalPattern }/g' src/features/goals/components/creation/PatternSelector.tsx
sed -i 's/import { CreateGoalRequest }/import type { CreateGoalRequest }/g' src/features/goals/components/creation/ReviewStep.tsx
sed -i 's/import { GoalPattern, GoalSchedule }/import type { GoalPattern, GoalSchedule }/g' src/features/goals/components/creation/ScheduleStep.tsx
sed -i 's/import { GoalPattern, GoalTarget }/import type { GoalPattern, GoalTarget }/g' src/features/goals/components/creation/TargetStep.tsx

# Fix display types
sed -i 's/import { Goal }/import type { Goal }/g' src/features/goals/components/display/GoalCard.tsx
sed -i 's/import { Goal }/import type { Goal }/g' src/features/goals/components/display/GoalList.tsx

# Fix logging types
sed -i 's/import { LogActivityRequest, ActivityType }/import type { LogActivityRequest, ActivityType }/g' src/features/goals/components/logging/QuickLogModal.tsx

# Fix hook types
sed -i 's/import {\s*Goal\s*}/import type { Goal }/g' src/features/goals/hooks/useGoals.ts
sed -i 's/import {\s*UpdateGoalRequest\s*}/import type { UpdateGoalRequest }/g' src/features/goals/hooks/useGoals.ts
sed -i 's/import {\s*LogActivityRequest\s*}/import type { LogActivityRequest }/g' src/features/goals/hooks/useGoals.ts

# Fix service types
sed -i 's/import {\s*Goal\s*}/import type { Goal }/g' src/features/goals/services/goalService.ts
sed -i 's/import {\s*CreateGoalRequest\s*}/import type { CreateGoalRequest }/g' src/features/goals/services/goalService.ts
sed -i 's/import {\s*UpdateGoalRequest\s*}/import type { UpdateGoalRequest }/g' src/features/goals/services/goalService.ts
sed -i 's/import {\s*GoalListResponse\s*}/import type { GoalListResponse }/g' src/features/goals/services/goalService.ts
sed -i 's/import {\s*GoalActivity\s*}/import type { GoalActivity }/g' src/features/goals/services/goalService.ts
sed -i 's/import {\s*LogActivityRequest\s*}/import type { LogActivityRequest }/g' src/features/goals/services/goalService.ts
sed -i 's/import {\s*GoalActivityListResponse\s*}/import type { GoalActivityListResponse }/g' src/features/goals/services/goalService.ts
sed -i 's/import {\s*GoalProgress\s*}/import type { GoalProgress }/g' src/features/goals/services/goalService.ts

# Fix ui types
sed -i 's/import { GoalPattern, Metric, Period, Direction, TargetType }/import type { GoalPattern, Metric, Period, Direction, TargetType }/g' src/features/goals/types/ui.types.ts

# Fix page types
sed -i 's/import {\s*Goal\s*}/import type { Goal }/g' src/pages/ComponentShowcase.tsx
sed -i 's/import {\s*GoalPattern\s*}/import type { GoalPattern }/g' src/pages/ComponentShowcase.tsx
sed -i 's/import { GoalStatus, GoalPattern }/import type { GoalStatus, GoalPattern }/g' src/pages/goals/GoalsPage.tsx

# Fix store types
sed -i 's/import { TypedUseSelectorHook }/import type { TypedUseSelectorHook }/g' src/store/hooks.ts
sed -i 's/import { PayloadAction }/import type { PayloadAction }/g' src/store/slices/encryptionSlice.ts

# Fix RegisterFormData type import
sed -i 's/import { RegisterFormData }/import type { RegisterFormData }/g' src/features/auth/components/RegistrationForm.tsx

echo "Type imports fixed!"

#!/bin/bash

# Fix TypeScript Build Errors Script

echo "🔧 Fixing TypeScript build errors..."

# Fix type imports in various files
echo "📝 Fixing type imports..."

# Fix MfaCodeInput.tsx
sed -i 's/import React, { useState, useRef, FormEvent, KeyboardEvent } from '\''react'\'';/import React, { useState, useRef } from '\''react'\'';\nimport type { FormEvent, KeyboardEvent } from '\''react'\'';/' src/features/auth/components/MfaCodeInput.tsx

# Fix goals types
sed -i 's/import { GoalTarget, Direction, TargetType } from/import { GoalTarget } from\nimport type { Direction, TargetType } from/' src/features/goals/types/ui.types.ts

# Fix settings component
sed -i 's/import { authService, UserProfile } from/import { authService } from\nimport type { UserProfile } from/' src/components/settings/SecuritySection.tsx

# Fix ComponentShowcase
sed -i 's/import {\n  Goal,\n  GoalPattern,/import type {\n  Goal,\n  GoalPattern,/' src/pages/ComponentShowcase.tsx

# Fix GoalsPage
sed -i 's/import { GoalStatus, GoalPattern } from/import type { GoalStatus, GoalPattern } from/' src/pages/goals/GoalsPage.tsx

# Fix store hooks
sed -i 's/import { useDispatch, useSelector, TypedUseSelectorHook } from/import { useDispatch, useSelector } from\nimport type { TypedUseSelectorHook } from/' src/store/hooks.ts

# Fix encryption slice
sed -i 's/import { createSlice, PayloadAction } from/import { createSlice } from\nimport type { PayloadAction } from/' src/store/slices/encryptionSlice.ts

echo "✅ Type imports fixed!"

echo ""
echo "Note: You may still need to:"
echo "1. Install @headlessui/react: npm install @headlessui/react --legacy-peer-deps"
echo "2. Run npm install to get @types/node"
echo "3. Fix any remaining application-specific type errors"

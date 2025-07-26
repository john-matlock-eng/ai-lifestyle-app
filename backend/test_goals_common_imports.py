#!/usr/bin/env python3
"""
Quick test to verify goals_common imports are working correctly.
Run this before creating the PR.
"""

import sys
import os

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))


def test_imports():
    """Test that all exports from goals_common can be imported."""
    print("Testing goals_common imports...")

    try:
        # Test the specific import that was failing
        from goals_common import GoalValidationError

        print("✅ GoalValidationError import successful")

        # Test all error imports
        from goals_common import (
            GoalError,
            GoalNotFoundError,
            GoalValidationError,
            GoalQuotaExceededError,
            GoalPermissionError,
            ActivityNotFoundError,
            ActivityValidationError,
            InvalidGoalPatternError,
            GoalAlreadyCompletedError,
            InvalidDateRangeError,
            GoalArchivedException,
            AttachmentUploadError,
            GoalSyncError,
        )

        print("✅ All error imports successful")

        # Test that we can instantiate the error
        error = GoalValidationError(["Test error"])
        assert error.error_code == "GOAL_VALIDATION_ERROR"
        print("✅ GoalValidationError instantiation successful")

        # Test a few other imports to ensure nothing broke
        from goals_common import Goal, GoalActivity, GoalsRepository

        print("✅ Model and repository imports successful")

        print("\n🎉 All imports working correctly!")
        return True

    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
Test script to verify camelCase handling in goal models.
"""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "goals_common"))

from models import ActivityContext, ActivityType, LogActivityRequest

# Test 1: Basic activity request with camelCase
print("Test 1: Basic activity request")
test_data = {
    "value": 12500,
    "unit": "steps",
    "activityType": "completed",
    "activityDate": "2024-01-20",
}

try:
    request = LogActivityRequest(**test_data)
    print(f"✅ Success! Parsed activity type: {request.activity_type}")
    print(f"   Serialized back to JSON: {request.model_dump_json(by_alias=True)}")
except Exception as e:
    print(f"❌ Failed: {e}")

# Test 2: Activity request with context
print("\nTest 2: Activity request with context")
test_data_with_context = {
    "value": 12500,
    "unit": "steps",
    "activityType": "completed",
    "activityDate": "2024-01-20",
    "context": {
        "timeOfDay": "evening",
        "dayOfWeek": "monday",
        "isWeekend": False,
        "energyLevel": 8,
        "enjoyment": 9,
    },
}

try:
    request = LogActivityRequest(**test_data_with_context)
    print(f"✅ Success! Context time of day: {request.context.time_of_day}")
    print(f"   Context energy level: {request.context.energy_level}")
    print(f"   Serialized: {request.model_dump_json(by_alias=True, indent=2)}")
except Exception as e:
    print(f"❌ Failed: {e}")
    import traceback

    traceback.print_exc()

# Test 3: Check field names in validation errors
print("\nTest 3: Check validation error field names")
test_invalid = {
    "value": -1,  # Invalid: negative value
    "unit": "steps",
    "activityType": "invalid_type",  # Invalid enum value
}

try:
    request = LogActivityRequest(**test_invalid)
    print("❌ Should have failed validation!")
except Exception as e:
    print(f"✅ Validation error (expected): {e}")
    if hasattr(e, "errors"):
        for error in e.errors():
            print(f"   Field: {error['loc']}, Message: {error['msg']}")


import json
"""
Feature flags endpoint handler - returns configuration flags from environment variables.
"""

import os
from typing import Any, Dict


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Return feature flags configuration.

    This endpoint returns feature flags that control various features in the frontend.
    Flags are configured via environment variables in Terraform.
    """

    # Get feature flags from environment variables
    # Convert string "true"/"false" to boolean
    debug_panels = os.environ.get("FEATURE_FLAG_DEBUG_PANELS", "false").lower() == "true"

    # Build response with all feature flags
    feature_flags = {
        "debugPanels": debug_panels
        # Add more feature flags here as needed
    }

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
        },
        "body": json.dumps(feature_flags),
    }

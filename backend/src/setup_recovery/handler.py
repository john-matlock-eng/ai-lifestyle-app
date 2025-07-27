import json

"""
Lambda handler for setting up encryption recovery methods.
"""

import os
from datetime import datetime
from datetime import datetime, timezone
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from encryption_common import EncryptionRepository, RecoveryMethod, RecoverySetupRequest

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


def extract_user_id(event: Dict[str, Any]) -> str:
    """
    Extract user ID from JWT claims.

    Args:
        event: Lambda event

    Returns:
        User ID

    Raises:
        ValueError: If user ID not found
    """
    # For authenticated endpoints, user info comes from JWT claims
    authorizer = event.get("requestContext", {}).get("authorizer", {})
    claims = authorizer.get("claims", {})

    if not claims:
        # Try alternative location for HTTP API
        authorizer = (
            event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        )
        if authorizer:
            claims = authorizer

    user_id = claims.get("sub")  # Cognito user ID

    if not user_id:
        raise ValueError("User ID not found in token")

    return user_id


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle recovery setup request.

    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object

    Returns:
        API Gateway Lambda proxy response
    """

    # Extract request ID for tracking
    request_id = context.aws_request_id

    try:
        # Extract user ID from JWT
        try:
            user_id = extract_user_id(event)
            logger.info(f"Recovery setup request from user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedRecoverySetupAttempts", unit=MetricUnit.Count, value=1
            )

            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "UNAUTHORIZED",
                        "message": "User authentication required",
                        "requestId": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ),
            }

        # Parse and validate request body
        body = json.loads(event.get("body", "{}"))

        try:
            # Validate request against schema
            request_data = RecoverySetupRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}", exc_info=True)
            metrics.add_metric(name="InvalidRecoverySetupRequests", unit=MetricUnit.Count, value=1)

            # Extract validation errors
            validation_errors = []
            if hasattr(e, "errors"):
                for error in e.errors():
                    validation_errors.append(
                        {"field": ".".join(str(x) for x in error["loc"]), "message": error["msg"]}
                    )
            else:
                validation_errors.append({"field": "request", "message": str(e)})

            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "VALIDATION_ERROR",
                        "message": "Validation failed",
                        "validationErrors": validation_errors,
                        "requestId": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ),
            }

        # Initialize repository
        table_name = os.environ.get("TABLE_NAME", "ai-lifestyle-dev")
        repository = EncryptionRepository(table_name)

        # Get current encryption keys
        encryption_keys = repository.get_encryption_keys(user_id)
        if not encryption_keys:
            logger.error(f"Encryption not set up for user {user_id}")
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "ENCRYPTION_NOT_SETUP",
                        "message": "Encryption must be set up before adding recovery methods",
                        "requestId": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ),
            }

        # Process recovery data based on method
        recovery_data = {}

        if request_data.method == RecoveryMethod.MNEMONIC:
            # Store hash of mnemonic phrase (never store the actual phrase)
            # In production, use proper hashing with salt
            recovery_data["mnemonic_hash"] = "hashed_mnemonic"  # Simplified

        elif request_data.method == RecoveryMethod.SOCIAL:
            # Store guardian information
            recovery_data["guardians"] = request_data.social_guardians
            recovery_data["threshold"] = request_data.social_threshold
            # In production, notify guardians and get their consent

        elif request_data.method == RecoveryMethod.SECURITY_QUESTIONS:
            # Store questions and hashed answers
            recovery_data["questions"] = []
            for q in request_data.security_questions:
                recovery_data["questions"].append(
                    {
                        "question": q["question"],
                        "answer_hash": "hashed_answer",  # Hash the answer in production
                    }
                )

        # Update encryption keys with recovery info
        encryption_keys.recovery_enabled = True
        if request_data.method not in encryption_keys.recovery_methods:
            encryption_keys.recovery_methods.append(request_data.method)

        # Merge recovery data
        if not encryption_keys.recovery_data:
            encryption_keys.recovery_data = {}
        encryption_keys.recovery_data[request_data.method.value] = {
            "setup_date": datetime.now(timezone.utc).isoformat(),
            "encrypted_recovery_key": request_data.encrypted_recovery_key,
            **recovery_data,
        }

        encryption_keys.updated_at = datetime.now(timezone.utc)

        # Save updated keys
        try:
            repository.save_encryption_keys(encryption_keys)
        except Exception as e:
            logger.error(f"Failed to save recovery setup: {str(e)}")
            metrics.add_metric(name="RecoverySetupFailures", unit=MetricUnit.Count, value=1)

            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "SYSTEM_ERROR",
                        "message": "Failed to save recovery setup",
                        "requestId": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ),
            }

        # Add metrics
        metrics.add_metric(name="RecoverySetupAttempts", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="SuccessfulRecoverySetups", unit=MetricUnit.Count, value=1)
        metrics.add_metric(
            name=f"RecoveryMethod_{request_data.method.value}", unit=MetricUnit.Count, value=1
        )

        return {
            "statusCode": 201,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "userId": user_id,
                    "method": request_data.method.value,
                    "recoveryEnabled": True,
                    "setupAt": datetime.now(timezone.utc).isoformat(),
                    "message": f"{request_data.method.value} recovery successfully set up",
                }
            ),
        }

    except Exception as e:
        logger.error(f"Unexpected error during recovery setup: {str(e)}", exc_info=True)
        metrics.add_metric(name="RecoverySetupSystemErrors", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "error": "SYSTEM_ERROR",
                    "message": "An unexpected error occurred",
                    "requestId": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ),
        }

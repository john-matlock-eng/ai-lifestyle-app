"""
Lambda handler for getting a user's public encryption key.
"""

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from encryption_common import EncryptionKeys, EncryptionRepository, PublicKeyResponse

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
    Handle request to get a user's public key.

    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object

    Returns:
        API Gateway Lambda proxy response
    """

    # Extract request ID for tracking
    request_id = context.aws_request_id

    try:
        # Extract requesting user ID from JWT
        try:
            requesting_user_id = extract_user_id(event)
            logger.info(f"Public key request from user {requesting_user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(name="UnauthorizedPublicKeyRequests", unit=MetricUnit.Count, value=1)

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

        # Extract target user ID from path parameters
        path_params = event.get("pathParameters", {})
        target_user_id = path_params.get("userId")

        if not target_user_id:
            logger.error("Target user ID not provided in path")
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "BAD_REQUEST",
                        "message": "User ID is required",
                        "requestId": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ),
            }

        logger.info(f"Getting public key for user {target_user_id}")

        # Initialize repository
        table_name = os.environ.get("TABLE_NAME", "ai-lifestyle-dev")
        repository = EncryptionRepository(table_name)

        # Check if requesting user is same as target user
        is_self_request = requesting_user_id == target_user_id

        logger.info(
            f"User {requesting_user_id} requesting encryption data for {target_user_id}, "
            f"is_self={is_self_request}"
        )

        # Track metrics
        metrics.add_metric(name="PublicKeyRequests", unit=MetricUnit.Count, value=1)

        if is_self_request:
            # Return full encryption data for self
            encryption_keys = repository.get_encryption_keys(target_user_id)

            if encryption_keys:
                metrics.add_metric(name="EncryptionKeysFound", unit=MetricUnit.Count, value=1)

                # Return full encryption data with camelCase field names
                response_data = {
                    "userId": target_user_id,
                    "publicKey": encryption_keys.public_key,
                    "publicKeyId": encryption_keys.public_key_id,
                    "salt": encryption_keys.salt,
                    "encryptedPrivateKey": encryption_keys.encrypted_private_key,
                    "hasEncryption": True,
                    "recoveryEnabled": encryption_keys.recovery_enabled,
                    "recoveryMethods": [
                        method.value for method in encryption_keys.recovery_methods
                    ],
                }

                return {
                    "statusCode": 200,
                    "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                    "body": json.dumps(response_data),
                }
            else:
                # No encryption setup
                return {
                    "statusCode": 200,
                    "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                    "body": json.dumps({"userId": target_user_id, "hasEncryption": False}),
                }
        else:
            # Return only public key info for others
            public_key_info = repository.get_public_key(target_user_id)

            if public_key_info:
                metrics.add_metric(name="PublicKeyFound", unit=MetricUnit.Count, value=1)

                response = PublicKeyResponse(
                    user_id=target_user_id,
                    public_key=public_key_info["public_key"],
                    public_key_id=public_key_info["public_key_id"],
                    has_encryption=True,
                )

                return {
                    "statusCode": 200,
                    "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                    "body": response.model_dump_json(by_alias=True),
                }
            else:
                metrics.add_metric(name="PublicKeyNotFound", unit=MetricUnit.Count, value=1)

            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "NOT_FOUND",
                        "message": f"User {target_user_id} has not set up encryption",
                        "requestId": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ),
            }

    except Exception as e:
        logger.error(f"Unexpected error getting public key: {str(e)}", exc_info=True)
        metrics.add_metric(name="PublicKeyRequestErrors", unit=MetricUnit.Count, value=1)

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

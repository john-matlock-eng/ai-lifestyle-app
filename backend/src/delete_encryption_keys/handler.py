"""
Lambda handler for deleting user encryption keys.
This is called when a user resets their encryption.
"""

import os
from datetime import datetime
from datetime import datetime, timezone
from typing import Any, Dict

import boto3
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from encryption_common import EncryptionRepository

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb")


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
    Handle encryption key deletion request.

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
            logger.info(f"Encryption deletion request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedEncryptionDeletionAttempts", unit=MetricUnit.Count, value=1
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

        # Initialize repository
        table_name = os.environ.get("TABLE_NAME", "ai-lifestyle-dev")
        repository = EncryptionRepository(table_name)

        # Check if encryption exists
        existing_keys = repository.get_encryption_keys(user_id)
        if not existing_keys:
            logger.warning(f"No encryption keys found for user {user_id}")
            metrics.add_metric(name="EncryptionDeletionNotFound", unit=MetricUnit.Count, value=1)

            # Still return success to ensure idempotency
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "message": "Encryption keys already deleted or never existed",
                        "requestId": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ),
            }

        # Delete encryption keys
        try:
            repository.delete_encryption_keys(user_id)
            logger.info(f"Deleted encryption keys for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to delete encryption keys: {str(e)}")
            metrics.add_metric(name="EncryptionDeletionFailures", unit=MetricUnit.Count, value=1)

            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "SYSTEM_ERROR",
                        "message": "Failed to delete encryption keys",
                        "requestId": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ),
            }

        # Update user profile to remove encryption fields
        try:
            table = dynamodb.Table(table_name)
            table.update_item(
                Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"},
                UpdateExpression="SET encryption_enabled = :enabled, updated_at = :updated_at REMOVE encryption_setup_date, encryption_key_id",
                ExpressionAttributeValues={
                    ":enabled": False,
                    ":updated_at": datetime.now(timezone.utc).isoformat(),
                },
            )
            logger.info(f"Updated user profile to remove encryption status for {user_id}")
        except Exception as e:
            logger.error(f"Failed to update user profile: {str(e)}")
            # Don't fail the request as the main operation (key deletion) succeeded
            metrics.add_metric(
                name="UserProfileEncryptionRemovalFailures", unit=MetricUnit.Count, value=1
            )

        # Delete any shared encryption entries for this user
        # This includes shares created by or for this user
        try:
            # Query for shares created by this user
            response = table.query(
                KeyConditionExpression="pk = :pk AND begins_with(sk, :sk_prefix)",
                ExpressionAttributeValues={":pk": f"USER#{user_id}", ":sk_prefix": "SHARE#"},
            )

            shares_to_delete = response.get("Items", [])

            # Delete each share
            for share in shares_to_delete:
                table.delete_item(Key={"pk": share["pk"], "sk": share["sk"]})
                logger.info(f"Deleted share {share['sk']} for user {user_id}")

            if shares_to_delete:
                logger.info(f"Deleted {len(shares_to_delete)} shares for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to delete shares: {str(e)}")
            # Non-fatal error, continue

        # Add metrics
        metrics.add_metric(name="EncryptionDeletionAttempts", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="SuccessfulEncryptionDeletions", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "message": "Encryption keys successfully deleted",
                    "userId": user_id,
                    "deletedAt": datetime.now(timezone.utc).isoformat(),
                    "requestId": request_id,
                }
            ),
        }

    except Exception as e:
        logger.error(f"Unexpected error during encryption deletion: {str(e)}", exc_info=True)
        metrics.add_metric(name="EncryptionDeletionSystemErrors", unit=MetricUnit.Count, value=1)

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

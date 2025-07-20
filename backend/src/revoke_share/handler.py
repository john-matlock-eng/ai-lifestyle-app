"""
Lambda handler for revoking encrypted shares.
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from common.response_utils import create_error_response, create_response

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


def extract_user_id(event: Dict[str, Any]) -> str:
    """Extract user ID from JWT claims."""
    authorizer = event.get("requestContext", {}).get("authorizer", {})
    claims = authorizer.get("claims", {})

    if not claims:
        # Try alternative location for HTTP API
        authorizer = (
            event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        )
        if authorizer:
            claims = authorizer

    user_id = claims.get("sub")
    if not user_id:
        raise ValueError("User ID not found in token")

    return user_id


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle share revocation request.

    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object

    Returns:
        API Gateway Lambda proxy response
    """

    request_id = context.aws_request_id

    try:
        # Extract user ID from JWT
        try:
            user_id = extract_user_id(event)
            logger.info(f"Revoke share request from user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedRevokeShareAttempts", unit=MetricUnit.Count, value=1
            )

            return create_error_response(
                status_code=401,
                error_code="UNAUTHORIZED",
                message="User authentication required",
                request_id=request_id,
            )

        # Extract share ID from path parameters
        path_params = event.get("pathParameters", {})
        share_id = path_params.get("shareId")

        if not share_id:
            logger.error("Share ID not provided in path parameters")
            metrics.add_metric(name="InvalidRevokeShareRequests", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=400,
                error_code="VALIDATION_ERROR",
                message="Share ID required",
                request_id=request_id,
            )

        # Initialize service
        from .service import RevokeShareService

        service = RevokeShareService()

        # Revoke the share
        try:
            service.revoke_share(user_id=user_id, share_id=share_id)

            metrics.add_metric(name="SharesRevoked", unit=MetricUnit.Count, value=1)

            # Return 204 No Content on success
            return {
                "statusCode": 204,
                "headers": {
                    "X-Request-ID": request_id,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                },
                "body": "",
            }

        except ValueError as e:
            logger.error(f"Share revocation failed: {str(e)}")
            metrics.add_metric(name="ShareRevocationFailures", unit=MetricUnit.Count, value=1)

            error_code = "SHARE_NOT_FOUND" if "not found" in str(e).lower() else "REVOCATION_FAILED"
            status_code = 404 if error_code == "SHARE_NOT_FOUND" else 403

            return create_error_response(
                status_code=status_code,
                error_code=error_code,
                message=str(e),
                request_id=request_id,
            )
        except Exception as e:
            logger.error(f"Unexpected error revoking share: {str(e)}")
            metrics.add_metric(name="ShareRevocationSystemErrors", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=500,
                error_code="SYSTEM_ERROR",
                message="Failed to revoke share",
                request_id=request_id,
            )

    except Exception as e:
        logger.error(f"Unexpected error in revoke share handler: {str(e)}", exc_info=True)
        metrics.add_metric(name="RevokeShareHandlerErrors", unit=MetricUnit.Count, value=1)

        return create_error_response(
            status_code=500,
            error_code="SYSTEM_ERROR",
            message="An unexpected error occurred",
            request_id=request_id,
        )

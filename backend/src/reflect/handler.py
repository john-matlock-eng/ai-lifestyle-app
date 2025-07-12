"""Lambda handler for POST /ai/reflect"""
import json
from typing import Any, Dict
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from pydantic import ValidationError

from journal_ai.service import JournalAIService
from journal_ai.models import ReflectRequest, SummarizeWeekResponse, ReflectResponse

logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")
service = JournalAIService()


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    request_id = context.aws_request_id if context else "unknown"

    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps({"error": "INVALID_JSON", "message": "Invalid JSON", "request_id": request_id})
        }

    try:
        req = ReflectRequest(**body)
    except ValidationError as e:
        errors = [{"field": ".".join(map(str, err["loc"])), "message": err["msg"]} for err in e.errors()]
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps({"error": "VALIDATION_ERROR", "message": "Validation failed", "validation_errors": errors, "request_id": request_id})
        }

    result: ReflectResponse = service.reflect(req)
    metrics.add_metric(name="JournalReflect", unit=MetricUnit.Count, value=1)
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
        "body": result.model_dump_json(by_alias=True)
    }

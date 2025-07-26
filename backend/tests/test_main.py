import json

"""
Tests for main API handler
"""


from src.main import app, handler


def test_health_endpoint(lambda_context, api_gateway_event, mock_dynamodb):
    """Test /health endpoint through main handler"""
    # Update event for health endpoint
    api_gateway_event["rawPath"] = "/health"
    api_gateway_event["requestContext"]["http"]["path"] = "/health"

    # Call handler
    response = handler(api_gateway_event, lambda_context)

    # Verify response
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["status"] == "healthy"
    assert body["environment"] == "test"


def test_get_user_found(lambda_context, api_gateway_event, mock_dynamodb):
    """Test getting a user that exists"""
    # Update event for user endpoint
    api_gateway_event["rawPath"] = "/users/test"
    api_gateway_event["pathParameters"] = {"user_id": "test"}
    api_gateway_event["requestContext"]["http"]["method"] = "GET"
    api_gateway_event["requestContext"]["http"]["path"] = "/users/test"
    api_gateway_event["routeKey"] = "GET /users/{user_id}"

    # Call handler
    response = handler(api_gateway_event, lambda_context)

    # Verify response
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["user_id"] == "test"
    assert body["name"] == "Test User"


def test_get_user_not_found(lambda_context, api_gateway_event, mock_dynamodb):
    """Test getting a user that doesn't exist"""
    # Update event for user endpoint
    api_gateway_event["rawPath"] = "/users/nonexistent"
    api_gateway_event["pathParameters"] = {"user_id": "nonexistent"}
    api_gateway_event["requestContext"]["http"]["method"] = "GET"
    api_gateway_event["requestContext"]["http"]["path"] = "/users/nonexistent"
    api_gateway_event["routeKey"] = "GET /users/{user_id}"

    # Call handler
    response = handler(api_gateway_event, lambda_context)

    # Verify response
    assert response["statusCode"] == 404


def test_create_user(lambda_context, api_gateway_event, mock_dynamodb):
    """Test creating a new user"""
    # Update event for POST endpoint
    api_gateway_event["rawPath"] = "/users"
    api_gateway_event["requestContext"]["http"]["method"] = "POST"
    api_gateway_event["requestContext"]["http"]["path"] = "/users"
    api_gateway_event["routeKey"] = "POST /users"
    api_gateway_event["body"] = json.dumps({"name": "New User", "email": "new@example.com"})

    # Call handler
    response = handler(api_gateway_event, lambda_context)

    # Verify response
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["status"] == "created"
    assert "user_id" in body


def test_invalid_route(lambda_context, api_gateway_event):
    """Test invalid route returns 404"""
    # Update event for invalid endpoint
    api_gateway_event["rawPath"] = "/invalid"
    api_gateway_event["requestContext"]["http"]["path"] = "/invalid"
    api_gateway_event["routeKey"] = "GET /invalid"

    # Call handler
    response = handler(api_gateway_event, lambda_context)

    # Verify response
    assert response["statusCode"] == 404


def test_error_handling(lambda_context, api_gateway_event, monkeypatch):
    """Test error handling in handler"""

    # Mock an error in the app resolver
    def mock_resolve(*args, **kwargs):
        raise Exception("Test error")

    monkeypatch.setattr(app, "resolve", mock_resolve)

    # Call handler
    response = handler(api_gateway_event, lambda_context)

    # Verify error response
    assert response["statusCode"] == 500
    body = json.loads(response["body"])
    assert body["error"] == "Internal server error"
    assert body["request_id"] == "test-request-id"

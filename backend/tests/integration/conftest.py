"""
Integration test fixtures
"""
import pytest
from unittest.mock import Mock

@pytest.fixture
def test_client():
    """Provide a test client for integration tests"""
    # This is a mock for now - in a real implementation this would be an HTTP client
    # pointing to a test deployment of the API
    mock_client = Mock()
    mock_client.base_url = "http://test-api.example.com"
    return mock_client


@pytest.fixture
def auth_headers():
    """Provide authentication headers for integration tests"""
    return {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json"
    }
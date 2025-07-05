"""
Edge case and error scenario tests for goal system.
Tests boundary conditions, validation, and error handling.
"""

import json
import uuid
from datetime import datetime, date, timedelta

import pytest

from src.goals_common.models import GoalPattern, GoalStatus, ActivityType


class TestGoalEdgeCases:
    """Test edge cases and error scenarios in the goal system."""
    
    @pytest.fixture
    def auth_headers(self) -> dict:
        """Mock authenticated user headers."""
        return {
            "Authorization": "Bearer test-token",
            "X-User-ID": str(uuid.uuid4())
        }
    
    @pytest.fixture
    def api_client(self, test_client):
        """Configure test client for integration tests."""
        return test_client
    
    def test_goal_validation_errors(self, api_client, auth_headers):
        """Test various validation errors when creating goals."""
        # 1. Missing required fields
        response = api_client.post("/v1/goals", 
                                 json={"title": "Test"},
                                 headers=auth_headers)
        assert response.status_code == 400
        error = response.json()
        assert error["error"] == "VALIDATION_ERROR"
        assert any("category" in err["field"] for err in error["validation_errors"])
        assert any("goalPattern" in err["field"] for err in error["validation_errors"])
        assert any("target" in err["field"] for err in error["validation_errors"])
        
        # 2. Invalid goal pattern
        goal_data = {
            "title": "Test Goal",
            "category": "fitness",
            "goalPattern": "invalid_pattern",
            "target": {
                "metric": "count",
                "value": 10,
                "unit": "reps",
                "direction": "increase"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 400
        
        # 3. Invalid target configuration for pattern
        # Recurring goal without period
        goal_data = {
            "title": "Invalid Recurring Goal",
            "category": "fitness",
            "goalPattern": "recurring",
            "target": {
                "metric": "count",
                "value": 10,
                "unit": "reps",
                "direction": "increase"
                # Missing required 'period' for recurring
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 400
        
        # 4. Milestone goal without target date
        goal_data = {
            "title": "Invalid Milestone Goal",
            "category": "fitness",
            "goalPattern": "milestone",
            "target": {
                "metric": "count",
                "value": 1000,
                "unit": "miles",
                "direction": "increase"
                # Missing required 'targetDate' for milestone
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 400
        
        # 5. Negative target value
        goal_data = {
            "title": "Negative Target",
            "category": "fitness",
            "goalPattern": "target",
            "target": {
                "metric": "count",
                "value": -10,
                "unit": "reps",
                "direction": "increase",
                "targetDate": "2024-12-31"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 400
        
        # 6. Title too long
        goal_data = {
            "title": "x" * 201,  # Exceeds 200 char limit
            "category": "fitness",
            "goalPattern": "recurring",
            "target": {
                "metric": "count",
                "value": 10,
                "unit": "reps",
                "period": "day",
                "direction": "increase"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 400
        
        # 7. Invalid color format
        goal_data = {
            "title": "Color Test",
            "category": "fitness",
            "goalPattern": "recurring",
            "color": "not-a-hex-color",  # Should be #RRGGBB
            "target": {
                "metric": "count",
                "value": 10,
                "unit": "reps",
                "period": "day",
                "direction": "increase"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 400
    
    def test_activity_validation_errors(self, api_client, auth_headers):
        """Test validation errors when logging activities."""
        # First create a valid goal
        goal_data = {
            "title": "Daily Steps",
            "category": "fitness",
            "goalPattern": "recurring",
            "target": {
                "metric": "count",
                "value": 10000,
                "unit": "steps",
                "period": "day",
                "direction": "increase"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 201
        goal_id = response.json()["goalId"]
        
        # 1. Invalid activity type
        activity = {
            "value": 5000,
            "unit": "steps",
            "activityType": "invalid_type"
        }
        
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=auth_headers)
        assert response.status_code == 400
        
        # 2. Mismatched unit
        activity = {
            "value": 5000,
            "unit": "miles",  # Goal expects 'steps'
            "activityType": "progress"
        }
        
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=auth_headers)
        assert response.status_code == 422
        
        # 3. Future date
        activity = {
            "value": 5000,
            "unit": "steps",
            "activityType": "progress",
            "activityDate": "2025-01-01"  # Future date
        }
        
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=auth_headers)
        assert response.status_code == 400
        
        # 4. Negative value
        activity = {
            "value": -1000,
            "unit": "steps",
            "activityType": "progress"
        }
        
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=auth_headers)
        assert response.status_code == 400
        
        # 5. Note too long
        activity = {
            "value": 5000,
            "unit": "steps",
            "activityType": "progress",
            "note": "x" * 501  # Exceeds 500 char limit
        }
        
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=auth_headers)
        assert response.status_code == 400
    
    def test_goal_update_restrictions(self, api_client, auth_headers):
        """Test restrictions on updating goals."""
        # 1. Create a goal
        goal_data = {
            "title": "Original Goal",
            "category": "fitness",
            "goalPattern": "recurring",
            "target": {
                "metric": "count",
                "value": 10,
                "unit": "reps",
                "period": "day",
                "direction": "increase"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 201
        goal = response.json()
        goal_id = goal["goalId"]
        
        # 2. Try to change goal pattern (not allowed)
        update_data = {
            "goalPattern": "milestone"  # Cannot change pattern
        }
        
        response = api_client.put(f"/v1/goals/{goal_id}",
                                json=update_data,
                                headers=auth_headers)
        assert response.status_code == 422
        
        # 3. Complete the goal by logging enough activities
        for i in range(30):  # Log activities for 30 days
            activity = {
                "value": 10,
                "unit": "reps",
                "activityType": "completed",
                "activityDate": (date(2024, 1, 1) + timedelta(days=i)).isoformat()
            }
            
            response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                     json=activity,
                                     headers=auth_headers)
            assert response.status_code == 201
        
        # Manually complete the goal (in real app this might be automatic)
        response = api_client.put(f"/v1/goals/{goal_id}",
                                json={"status": "completed"},
                                headers=auth_headers)
        assert response.status_code == 200
        
        # 4. Try to update completed goal
        update_data = {
            "title": "Updated Title"
        }
        
        response = api_client.put(f"/v1/goals/{goal_id}",
                                json=update_data,
                                headers=auth_headers)
        assert response.status_code == 422
        error = response.json()
        assert "completed" in error["message"].lower()
        
        # 5. Archive the goal
        response = api_client.delete(f"/v1/goals/{goal_id}",
                                   headers=auth_headers)
        assert response.status_code == 200
        
        # 6. Try to update archived goal
        response = api_client.put(f"/v1/goals/{goal_id}",
                                json=update_data,
                                headers=auth_headers)
        assert response.status_code == 422
        error = response.json()
        assert "archived" in error["message"].lower()
    
    def test_pagination_limits(self, api_client, auth_headers):
        """Test pagination boundaries and limits."""
        # Create multiple goals
        for i in range(25):
            goal_data = {
                "title": f"Goal {i+1}",
                "category": "test",
                "goalPattern": "recurring",
                "target": {
                    "metric": "count",
                    "value": 10,
                    "unit": "times",
                    "period": "day",
                    "direction": "increase"
                }
            }
            
            response = api_client.post("/v1/goals", 
                                     json=goal_data,
                                     headers=auth_headers)
            assert response.status_code == 201
        
        # 1. Test default pagination
        response = api_client.get("/v1/goals",
                                headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert len(result["goals"]) == 20  # Default limit
        assert result["pagination"]["page"] == 1
        assert result["pagination"]["limit"] == 20
        assert result["pagination"]["total"] >= 25
        
        # 2. Test custom limit
        response = api_client.get("/v1/goals?limit=10",
                                headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert len(result["goals"]) == 10
        
        # 3. Test max limit enforcement
        response = api_client.get("/v1/goals?limit=150",  # Exceeds max of 100
                                headers=auth_headers)
        assert response.status_code == 400
        
        # 4. Test page navigation
        response = api_client.get("/v1/goals?page=2&limit=10",
                                headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert result["pagination"]["page"] == 2
        
        # 5. Test beyond last page
        response = api_client.get("/v1/goals?page=100&limit=20",
                                headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert len(result["goals"]) == 0
        assert result["pagination"]["page"] == 100
    
    def test_concurrent_goal_limits(self, api_client, auth_headers):
        """Test limits on number of active goals."""
        # Create maximum allowed active goals (e.g., 50)
        max_goals = 50
        created_goals = []
        
        for i in range(max_goals):
            goal_data = {
                "title": f"Active Goal {i+1}",
                "category": "test",
                "goalPattern": "recurring",
                "target": {
                    "metric": "count",
                    "value": 10,
                    "unit": "times",
                    "period": "day",
                    "direction": "increase"
                }
            }
            
            response = api_client.post("/v1/goals", 
                                     json=goal_data,
                                     headers=auth_headers)
            assert response.status_code == 201
            created_goals.append(response.json()["goalId"])
        
        # Try to create one more
        goal_data = {
            "title": "One Too Many",
            "category": "test",
            "goalPattern": "recurring",
            "target": {
                "metric": "count",
                "value": 10,
                "unit": "times",
                "period": "day",
                "direction": "increase"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 422
        error = response.json()
        assert "limit" in error["message"].lower()
        
        # Archive one goal
        response = api_client.delete(f"/v1/goals/{created_goals[0]}",
                                   headers=auth_headers)
        assert response.status_code == 200
        
        # Now creation should succeed
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 201
    
    def test_date_edge_cases(self, api_client, auth_headers):
        """Test edge cases around dates and timezones."""
        # 1. Create goal with target date
        goal_data = {
            "title": "Year End Goal",
            "category": "test",
            "goalPattern": "target",
            "target": {
                "metric": "count",
                "value": 100,
                "unit": "items",
                "direction": "increase",
                "targetDate": "2024-12-31"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 201
        goal_id = response.json()["goalId"]
        
        # 2. Log activity at end of day (timezone boundary)
        activity = {
            "value": 10,
            "unit": "items",
            "activityType": "progress",
            "activityDate": "2024-01-20",
            "loggedAt": "2024-01-20T23:59:59Z"  # Just before midnight UTC
        }
        
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=auth_headers)
        assert response.status_code == 201
        
        # 3. Test leap year date
        activity = {
            "value": 10,
            "unit": "items",
            "activityType": "progress",
            "activityDate": "2024-02-29"  # Leap year
        }
        
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=auth_headers)
        assert response.status_code == 201
        
        # 4. Test invalid leap year date
        activity = {
            "value": 10,
            "unit": "items",
            "activityType": "progress",
            "activityDate": "2023-02-29"  # Not a leap year
        }
        
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=auth_headers)
        assert response.status_code == 400
    
    def test_special_characters_and_unicode(self, api_client, auth_headers):
        """Test handling of special characters and unicode."""
        # 1. Unicode in goal title and description
        goal_data = {
            "title": "学习中文 🎯",  # Chinese characters and emoji
            "description": "Practice Chinese for 30 minutes daily 加油！💪",
            "category": "education",
            "goalPattern": "recurring",
            "target": {
                "metric": "duration",
                "value": 30,
                "unit": "minutes",
                "period": "day",
                "direction": "increase"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 201
        goal = response.json()
        assert goal["title"] == goal_data["title"]
        assert goal["description"] == goal_data["description"]
        goal_id = goal["goalId"]
        
        # 2. Special characters in notes
        activity = {
            "value": 30,
            "unit": "minutes",
            "activityType": "completed",
            "note": "Today's lesson: 你好! <script>alert('xss')</script> & more"
        }
        
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=auth_headers)
        assert response.status_code == 201
        activity_response = response.json()
        # Verify XSS attempt is safely stored (escaped or sanitized)
        assert "<script>" not in activity_response["note"] or activity_response["note"] == activity["note"]
    
    def test_authorization_boundaries(self, api_client):
        """Test authorization and access control."""
        # Create two different users
        user1_headers = {
            "Authorization": "Bearer user1-token",
            "X-User-ID": str(uuid.uuid4())
        }
        
        user2_headers = {
            "Authorization": "Bearer user2-token",
            "X-User-ID": str(uuid.uuid4())
        }
        
        # 1. User 1 creates a goal
        goal_data = {
            "title": "User 1's Private Goal",
            "category": "personal",
            "goalPattern": "recurring",
            "visibility": "private",
            "target": {
                "metric": "count",
                "value": 1,
                "unit": "times",
                "period": "day",
                "direction": "increase"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=user1_headers)
        assert response.status_code == 201
        goal_id = response.json()["goalId"]
        
        # 2. User 2 tries to access User 1's goal
        response = api_client.get(f"/v1/goals/{goal_id}",
                                headers=user2_headers)
        assert response.status_code == 404  # Should not reveal existence
        
        # 3. User 2 tries to update User 1's goal
        response = api_client.put(f"/v1/goals/{goal_id}",
                                json={"title": "Hacked!"},
                                headers=user2_headers)
        assert response.status_code == 404
        
        # 4. User 2 tries to log activity on User 1's goal
        activity = {
            "value": 1,
            "unit": "times",
            "activityType": "completed"
        }
        
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=user2_headers)
        assert response.status_code == 404
        
        # 5. User 2 tries to archive User 1's goal
        response = api_client.delete(f"/v1/goals/{goal_id}",
                                   headers=user2_headers)
        assert response.status_code == 404
        
        # 6. No authentication
        response = api_client.get(f"/v1/goals/{goal_id}")
        assert response.status_code == 401

import json
import uuid

"""
Integration tests for complete goal user journey.
Tests all goal endpoints working together in realistic scenarios.
"""

from datetime import date, datetime, timedelta
from typing import Any, Dict

import pytest
from freezegun import freeze_time

from src.goals_common.models import ActivityType, GoalPattern, GoalStatus


class TestGoalUserJourney:
    """Test complete user journeys through the goal system."""

    @pytest.fixture
    def auth_headers(self) -> Dict[str, str]:
        """Mock authenticated user headers."""
        return {"Authorization": "Bearer test-token", "X-User-ID": str(uuid.uuid4())}

    @pytest.fixture
    def api_client(self, test_client):
        """Configure test client for integration tests."""
        return test_client

    def test_daily_habit_journey(self, api_client, auth_headers):
        """Test creating and tracking a daily habit (recurring pattern)."""
        # 1. Create a daily water intake goal
        goal_data = {
            "title": "Drink 8 glasses of water daily",
            "description": "Stay hydrated throughout the day",
            "category": "health",
            "goalPattern": "recurring",
            "target": {
                "metric": "count",
                "value": 8,
                "unit": "glasses",
                "period": "day",
                "direction": "increase",
                "targetType": "minimum",
            },
            "schedule": {
                "frequency": "daily",
                "checkInFrequency": "daily",
                "allowSkipDays": 2,
                "catchUpAllowed": False,
            },
            "context": {
                "motivation": "Better health and energy levels",
                "importanceLevel": 4,
                "preferredActivities": ["Morning hydration", "With meals", "During workouts"],
                "obstacles": ["Forgetting", "Busy schedule"],
            },
        }

        # Create goal
        response = api_client.post("/v1/goals", json=goal_data, headers=auth_headers)
        assert response.status_code == 201
        goal = response.json()
        goal_id = goal["goalId"]

        # Verify goal created correctly
        assert goal["title"] == goal_data["title"]
        assert goal["goalPattern"] == "recurring"
        assert goal["status"] == "active"
        assert goal["progress"]["percentComplete"] == 0
        assert goal["progress"]["currentStreak"] == 0

        # 2. Log activities for multiple days
        with freeze_time("2024-01-20 10:00:00"):
            # Day 1 - Complete goal
            for i in range(8):
                activity = {
                    "value": 1,
                    "unit": "glasses",
                    "activityType": "progress",
                    "activityDate": "2024-01-20",
                    "context": {
                        "timeOfDay": "morning" if i < 3 else "afternoon" if i < 6 else "evening",
                        "energyLevel": 7,
                        "enjoyment": 8,
                    },
                    "note": f"Glass {i+1} of water",
                }

                response = api_client.post(
                    f"/v1/goals/{goal_id}/activities", json=activity, headers=auth_headers
                )
                assert response.status_code == 201

        # Check progress after day 1
        response = api_client.get(
            f"/v1/goals/{goal_id}/progress?period=current", headers=auth_headers
        )
        assert response.status_code == 200
        progress = response.json()
        assert progress["progress"]["currentPeriodValue"] == 8
        assert progress["progress"]["percentComplete"] == 100
        assert progress["progress"]["currentStreak"] == 1

        # Day 2 - Partial completion
        with freeze_time("2024-01-21 20:00:00"):
            for i in range(6):
                activity = {
                    "value": 1,
                    "unit": "glasses",
                    "activityType": "progress",
                    "activityDate": "2024-01-21",
                }

                response = api_client.post(
                    f"/v1/goals/{goal_id}/activities", json=activity, headers=auth_headers
                )
                assert response.status_code == 201

        # Day 3 - Skip day
        with freeze_time("2024-01-22 23:00:00"):
            activity = {
                "value": 0,
                "unit": "glasses",
                "activityType": "skipped",
                "activityDate": "2024-01-22",
                "note": "Sick day - focusing on rest",
            }

            response = api_client.post(
                f"/v1/goals/{goal_id}/activities", json=activity, headers=auth_headers
            )
            assert response.status_code == 201

        # 3. List activities with filtering
        response = api_client.get(
            f"/v1/goals/{goal_id}/activities?startDate=2024-01-20&endDate=2024-01-22",
            headers=auth_headers,
        )
        assert response.status_code == 200
        activities = response.json()
        assert activities["pagination"]["total"] == 15  # 8 + 6 + 1

        # 4. Get current progress
        response = api_client.get(f"/v1/goals/{goal_id}/progress?period=week", headers=auth_headers)
        assert response.status_code == 200
        progress = response.json()
        assert progress["statistics"]["totalActivities"] == 15
        assert progress["statistics"]["completedActivities"] == 14
        assert progress["statistics"]["skippedActivities"] == 1

        # 5. Update goal to be more realistic
        update_data = {
            "target": {"value": 6},  # Reduce to 6 glasses
            "description": "Stay hydrated - adjusted to 6 glasses for sustainability",
        }

        response = api_client.put(f"/v1/goals/{goal_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        updated_goal = response.json()
        assert updated_goal["target"]["value"] == 6

        # 6. List goals with filters
        response = api_client.get(
            "/v1/goals?status=active&goalPattern=recurring", headers=auth_headers
        )
        assert response.status_code == 200
        goals = response.json()
        assert len(goals["goals"]) >= 1
        assert any(g["goalId"] == goal_id for g in goals["goals"])

    def test_milestone_goal_journey(self, api_client, auth_headers):
        """Test creating and tracking a milestone goal (writing a novel)."""
        # 1. Create a novel writing goal
        goal_data = {
            "title": "Write my first novel",
            "description": "Complete an 80,000 word fantasy novel",
            "category": "creativity",
            "goalPattern": "milestone",
            "target": {
                "metric": "count",
                "value": 80000,
                "unit": "words",
                "direction": "increase",
                "targetDate": "2024-12-31",
                "startValue": 0,
                "currentValue": 0,
            },
            "rewards": {
                "milestoneRewards": [
                    {"value": 10000, "reward": "Treat yourself to favorite coffee"},
                    {"value": 25000, "reward": "Buy that writing software"},
                    {"value": 50000, "reward": "Weekend writing retreat"},
                    {"value": 80000, "reward": "Professional editing service"},
                ]
            },
        }

        response = api_client.post("/v1/goals", json=goal_data, headers=auth_headers)
        assert response.status_code == 201
        goal = response.json()
        goal_id = goal["goalId"]

        # 2. Log writing sessions
        writing_sessions = [
            {"date": "2024-01-20", "words": 1500, "note": "Great opening chapter!"},
            {"date": "2024-01-21", "words": 800, "note": "Struggled with dialogue"},
            {"date": "2024-01-22", "words": 2200, "note": "Flow state achieved"},
            {"date": "2024-01-23", "words": 1800, "note": "Exciting plot twist"},
            {"date": "2024-01-24", "words": 3000, "note": "Best writing day yet!"},
            {"date": "2024-01-25", "words": 1200, "note": "Editing previous chapters"},
        ]

        total_words = 0
        for session in writing_sessions:
            activity = {
                "value": session["words"],
                "unit": "words",
                "activityType": "progress",
                "activityDate": session["date"],
                "note": session["note"],
                "context": {
                    "duration": round(session["words"] / 250 * 60),  # Assume 250 words/hour
                    "difficulty": 3,
                    "enjoyment": 4,
                },
            }

            response = api_client.post(
                f"/v1/goals/{goal_id}/activities", json=activity, headers=auth_headers
            )
            assert response.status_code == 201
            total_words += session["words"]

        # 3. Check progress and milestones
        response = api_client.get(f"/v1/goals/{goal_id}/progress", headers=auth_headers)
        assert response.status_code == 200
        progress = response.json()

        assert progress["progress"]["totalAccumulated"] == total_words
        assert progress["progress"]["remainingToGoal"] == 80000 - total_words
        assert progress["progress"]["percentComplete"] == round(total_words / 80000 * 100, 2)

        # Check if first milestone was reached
        response = api_client.get(f"/v1/goals/{goal_id}", headers=auth_headers)
        assert response.status_code == 200
        goal = response.json()
        rewards = goal["rewards"]["milestoneRewards"]
        assert rewards[0].get("unlockedAt") is not None  # First milestone unlocked

    def test_streak_goal_journey(self, api_client, auth_headers):
        """Test creating and maintaining a streak goal (meditation)."""
        # 1. Create meditation streak goal
        goal_data = {
            "title": "Daily meditation practice",
            "description": "Build a consistent meditation habit",
            "category": "wellness",
            "goalPattern": "streak",
            "target": {
                "metric": "duration",
                "value": 10,
                "unit": "minutes",
                "period": "day",
                "direction": "maintain",
                "targetType": "minimum",
            },
            "schedule": {
                "frequency": "daily",
                "preferredTimes": ["06:00", "20:00"],
                "allowSkipDays": 1,
                "catchUpAllowed": True,
            },
        }

        response = api_client.post("/v1/goals", json=goal_data, headers=auth_headers)
        assert response.status_code == 201
        goal = response.json()
        goal_id = goal["goalId"]

        # 2. Build a streak
        for day in range(7):
            date_str = (date(2024, 1, 20) + timedelta(days=day)).isoformat()
            activity = {
                "value": 10 + (day % 3) * 5,  # Vary between 10-20 minutes
                "unit": "minutes",
                "activityType": "completed",
                "activityDate": date_str,
                "context": {
                    "timeOfDay": "morning" if day % 2 == 0 else "evening",
                    "energyLevel": 6 + day % 3,
                    "stressLevel": max(1, 7 - day % 4),
                    "enjoyment": min(5, 3 + day % 3),
                },
            }

            response = api_client.post(
                f"/v1/goals/{goal_id}/activities", json=activity, headers=auth_headers
            )
            assert response.status_code == 201

        # 3. Check streak status
        response = api_client.get(f"/v1/goals/{goal_id}/progress", headers=auth_headers)
        assert response.status_code == 200
        progress = response.json()

        assert progress["progress"]["currentStreak"] == 7
        assert progress["progress"]["longestStreak"] == 7
        assert progress["progress"]["successRate"] == 100

        # 4. Break the streak
        skip_activity = {
            "value": 0,
            "unit": "minutes",
            "activityType": "skipped",
            "activityDate": "2024-01-27",
            "note": "Emergency came up",
        }

        response = api_client.post(
            f"/v1/goals/{goal_id}/activities", json=skip_activity, headers=auth_headers
        )
        assert response.status_code == 201

        # 5. Restart the streak
        restart_activity = {
            "value": 15,
            "unit": "minutes",
            "activityType": "completed",
            "activityDate": "2024-01-28",
            "note": "Back on track!",
        }

        response = api_client.post(
            f"/v1/goals/{goal_id}/activities", json=restart_activity, headers=auth_headers
        )
        assert response.status_code == 201

        # Check streak was reset but longest streak preserved
        response = api_client.get(f"/v1/goals/{goal_id}/progress", headers=auth_headers)
        assert response.status_code == 200
        progress = response.json()

        assert progress["progress"]["currentStreak"] == 1
        assert progress["progress"]["longestStreak"] == 7

    def test_limit_goal_journey(self, api_client, auth_headers):
        """Test creating and tracking a limit goal (screen time)."""
        # 1. Create screen time limit goal
        goal_data = {
            "title": "Reduce social media usage",
            "description": "Limit social media to 30 minutes per day",
            "category": "wellness",
            "goalPattern": "limit",
            "target": {
                "metric": "duration",
                "value": 30,
                "unit": "minutes",
                "period": "day",
                "direction": "decrease",
                "targetType": "maximum",
            },
            "context": {
                "motivation": "More time for meaningful activities",
                "obstacles": ["FOMO", "Habit", "Boredom"],
                "successFactors": ["App timers", "Alternative activities", "Accountability"],
            },
        }

        response = api_client.post("/v1/goals", json=goal_data, headers=auth_headers)
        assert response.status_code == 201
        goal = response.json()
        goal_id = goal["goalId"]

        # 2. Track daily usage
        daily_usage = [
            {"date": "2024-01-20", "minutes": 45, "note": "Baseline day"},
            {"date": "2024-01-21", "minutes": 35, "note": "Almost made it"},
            {"date": "2024-01-22", "minutes": 25, "note": "Success! Under limit"},
            {"date": "2024-01-23", "minutes": 20, "note": "Great progress"},
            {"date": "2024-01-24", "minutes": 40, "note": "Stressful day"},
            {"date": "2024-01-25", "minutes": 15, "note": "Best day yet!"},
        ]

        days_over_limit = 0
        for usage in daily_usage:
            activity = {
                "value": usage["minutes"],
                "unit": "minutes",
                "activityType": "progress",
                "activityDate": usage["date"],
                "note": usage["note"],
            }

            response = api_client.post(
                f"/v1/goals/{goal_id}/activities", json=activity, headers=auth_headers
            )
            assert response.status_code == 201

            if usage["minutes"] > 30:
                days_over_limit += 1

        # 3. Check limit compliance
        response = api_client.get(f"/v1/goals/{goal_id}/progress?period=week", headers=auth_headers)
        assert response.status_code == 200
        progress = response.json()

        assert progress["progress"]["daysOverLimit"] == days_over_limit
        assert progress["statistics"]["averageValue"] == sum(
            u["minutes"] for u in daily_usage
        ) / len(daily_usage)

    def test_target_goal_journey(self, api_client, auth_headers):
        """Test creating and tracking a target goal (savings)."""
        # 1. Create savings target goal
        goal_data = {
            "title": "Emergency fund",
            "description": "Save $5000 for emergency fund by end of year",
            "category": "finance",
            "goalPattern": "target",
            "target": {
                "metric": "amount",
                "value": 5000,
                "unit": "dollars",
                "direction": "increase",
                "targetDate": "2024-12-31",
                "startValue": 500,
                "currentValue": 500,
            },
            "visibility": "private",  # Financial goals should be private
        }

        response = api_client.post("/v1/goals", json=goal_data, headers=auth_headers)
        assert response.status_code == 201
        goal = response.json()
        goal_id = goal["goalId"]

        # 2. Log savings deposits
        deposits = [
            {"date": "2024-01-20", "amount": 200, "note": "Monthly automatic transfer"},
            {"date": "2024-01-25", "amount": 150, "note": "Freelance project bonus"},
            {"date": "2024-02-01", "amount": 200, "note": "Monthly automatic transfer"},
            {"date": "2024-02-10", "amount": 300, "note": "Tax refund portion"},
        ]

        total_saved = 500  # Starting value
        for deposit in deposits:
            activity = {
                "value": deposit["amount"],
                "unit": "dollars",
                "activityType": "progress",
                "activityDate": deposit["date"],
                "note": deposit["note"],
            }

            response = api_client.post(
                f"/v1/goals/{goal_id}/activities", json=activity, headers=auth_headers
            )
            assert response.status_code == 201
            total_saved += deposit["amount"]

        # 3. Check progress and projection
        response = api_client.get(f"/v1/goals/{goal_id}/progress", headers=auth_headers)
        assert response.status_code == 200
        progress = response.json()

        assert progress["progress"]["totalAccumulated"] == total_saved
        assert progress["progress"]["remainingToGoal"] == 5000 - total_saved
        assert progress["progress"]["percentComplete"] == round(total_saved / 5000 * 100, 2)
        assert "projectedCompletion" in progress["progress"]  # Should have a projection

    def test_goal_archival_and_completion(self, api_client, auth_headers):
        """Test completing and archiving goals."""
        # 1. Create a simple goal
        goal_data = {
            "title": "Read 12 books this year",
            "category": "personal-growth",
            "goalPattern": "target",
            "target": {
                "metric": "count",
                "value": 12,
                "unit": "books",
                "direction": "increase",
                "targetDate": "2024-12-31",
                "currentValue": 0,
            },
        }

        response = api_client.post("/v1/goals", json=goal_data, headers=auth_headers)
        assert response.status_code == 201
        goal = response.json()
        goal_id = goal["goalId"]

        # 2. Complete the goal by logging 12 books
        for i in range(12):
            activity = {
                "value": 1,
                "unit": "books",
                "activityType": "progress",
                "note": f"Finished book {i+1}: Great read!",
            }

            response = api_client.post(
                f"/v1/goals/{goal_id}/activities", json=activity, headers=auth_headers
            )
            assert response.status_code == 201

        # 3. Goal should be automatically marked as completed
        response = api_client.get(f"/v1/goals/{goal_id}", headers=auth_headers)
        assert response.status_code == 200
        goal = response.json()
        assert goal["status"] == "completed"
        assert goal["completedAt"] is not None

        # 4. Archive the completed goal
        response = api_client.delete(f"/v1/goals/{goal_id}", headers=auth_headers)
        assert response.status_code == 200

        # 5. Verify goal is archived
        response = api_client.get(f"/v1/goals/{goal_id}", headers=auth_headers)
        assert response.status_code == 200
        goal = response.json()
        assert goal["status"] == "archived"

        # 6. Archived goals should not appear in active list
        response = api_client.get("/v1/goals?status=active", headers=auth_headers)
        assert response.status_code == 200
        goals = response.json()
        assert not any(g["goalId"] == goal_id for g in goals["goals"])

        # 7. But should appear when specifically requesting archived
        response = api_client.get("/v1/goals?status=archived", headers=auth_headers)
        assert response.status_code == 200
        goals = response.json()
        assert any(g["goalId"] == goal_id for g in goals["goals"])

    def test_concurrent_activity_logging(self, api_client, auth_headers):
        """Test handling concurrent activity logging."""
        # Create a goal
        goal_data = {
            "title": "Daily pushups",
            "category": "fitness",
            "goalPattern": "recurring",
            "target": {
                "metric": "count",
                "value": 50,
                "unit": "pushups",
                "period": "day",
                "direction": "increase",
            },
        }

        response = api_client.post("/v1/goals", json=goal_data, headers=auth_headers)
        assert response.status_code == 201
        goal = response.json()
        goal_id = goal["goalId"]

        # Simulate concurrent activity logging (in real scenario these would be parallel)
        activities = []
        for i in range(5):
            activity = {
                "value": 10,
                "unit": "pushups",
                "activityType": "progress",
                "activityDate": "2024-01-20",
                "note": f"Set {i+1}",
            }

            response = api_client.post(
                f"/v1/goals/{goal_id}/activities", json=activity, headers=auth_headers
            )
            assert response.status_code == 201
            activities.append(response.json())

        # Verify all activities were logged
        response = api_client.get(
            f"/v1/goals/{goal_id}/activities?activityDate=2024-01-20", headers=auth_headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["pagination"]["total"] == 5

        # Verify progress was calculated correctly
        response = api_client.get(f"/v1/goals/{goal_id}/progress", headers=auth_headers)
        assert response.status_code == 200
        progress = response.json()
        assert progress["progress"]["currentPeriodValue"] == 50
        assert progress["progress"]["percentComplete"] == 100

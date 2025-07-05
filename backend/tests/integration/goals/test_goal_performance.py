"""
Performance and load tests for goal system.
Tests system performance under various load conditions.
"""

import json
import uuid
import time
import asyncio
from datetime import datetime, date, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Tuple

import pytest
import aiohttp
from locust import HttpUser, task, between


class TestGoalPerformance:
    """Test performance characteristics of the goal system."""
    
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
    
    def test_response_time_targets(self, api_client, auth_headers):
        """Verify all endpoints meet response time targets."""
        # Create test data
        goal_data = {
            "title": "Performance Test Goal",
            "category": "test",
            "goalPattern": "recurring",
            "target": {
                "metric": "count",
                "value": 100,
                "unit": "items",
                "period": "day",
                "direction": "increase"
            }
        }
        
        # 1. Create goal - target < 300ms
        start = time.time()
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        create_time = time.time() - start
        assert response.status_code == 201
        assert create_time < 0.3  # 300ms
        goal_id = response.json()["goalId"]
        
        # 2. Get goal - target < 100ms
        start = time.time()
        response = api_client.get(f"/v1/goals/{goal_id}",
                                headers=auth_headers)
        get_time = time.time() - start
        assert response.status_code == 200
        assert get_time < 0.1  # 100ms
        
        # 3. List goals - target < 200ms
        start = time.time()
        response = api_client.get("/v1/goals",
                                headers=auth_headers)
        list_time = time.time() - start
        assert response.status_code == 200
        assert list_time < 0.2  # 200ms
        
        # 4. Log activity - target < 200ms
        activity = {
            "value": 10,
            "unit": "items",
            "activityType": "progress"
        }
        
        start = time.time()
        response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                 json=activity,
                                 headers=auth_headers)
        log_time = time.time() - start
        assert response.status_code == 201
        assert log_time < 0.2  # 200ms
        
        # 5. Get progress - target < 200ms (includes calculation)
        start = time.time()
        response = api_client.get(f"/v1/goals/{goal_id}/progress",
                                headers=auth_headers)
        progress_time = time.time() - start
        assert response.status_code == 200
        assert progress_time < 0.2  # 200ms
        
        print(f"Performance Results:")
        print(f"  Create: {create_time*1000:.2f}ms")
        print(f"  Get: {get_time*1000:.2f}ms")
        print(f"  List: {list_time*1000:.2f}ms")
        print(f"  Log Activity: {log_time*1000:.2f}ms")
        print(f"  Progress: {progress_time*1000:.2f}ms")
    
    def test_concurrent_goal_creation(self, api_client):
        """Test creating multiple goals concurrently."""
        num_users = 20
        goals_per_user = 5
        
        def create_user_goals(user_id: int) -> List[Dict[str, Any]]:
            """Create goals for a single user."""
            headers = {
                "Authorization": f"Bearer user-{user_id}-token",
                "X-User-ID": str(uuid.uuid4())
            }
            
            results = []
            for i in range(goals_per_user):
                goal_data = {
                    "title": f"User {user_id} Goal {i+1}",
                    "category": "test",
                    "goalPattern": "recurring",
                    "target": {
                        "metric": "count",
                        "value": 100,
                        "unit": "items",
                        "period": "day",
                        "direction": "increase"
                    }
                }
                
                start = time.time()
                response = api_client.post("/v1/goals", 
                                         json=goal_data,
                                         headers=headers)
                duration = time.time() - start
                
                results.append({
                    "status": response.status_code,
                    "duration": duration,
                    "goal_id": response.json().get("goalId") if response.status_code == 201 else None
                })
            
            return results
        
        # Execute concurrent requests
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=num_users) as executor:
            futures = [executor.submit(create_user_goals, i) for i in range(num_users)]
            all_results = []
            
            for future in as_completed(futures):
                all_results.extend(future.result())
        
        total_time = time.time() - start_time
        
        # Analyze results
        successful = sum(1 for r in all_results if r["status"] == 201)
        failed = sum(1 for r in all_results if r["status"] != 201)
        avg_duration = sum(r["duration"] for r in all_results) / len(all_results)
        max_duration = max(r["duration"] for r in all_results)
        
        print(f"\nConcurrent Goal Creation Results:")
        print(f"  Total requests: {len(all_results)}")
        print(f"  Successful: {successful}")
        print(f"  Failed: {failed}")
        print(f"  Total time: {total_time:.2f}s")
        print(f"  Avg response time: {avg_duration*1000:.2f}ms")
        print(f"  Max response time: {max_duration*1000:.2f}ms")
        print(f"  Throughput: {len(all_results)/total_time:.2f} req/s")
        
        # Assertions
        assert successful == num_users * goals_per_user  # All should succeed
        assert avg_duration < 0.5  # Average under 500ms
        assert max_duration < 2.0  # Max under 2 seconds
    
    def test_activity_logging_burst(self, api_client, auth_headers):
        """Test burst activity logging (multiple users logging simultaneously)."""
        # Create a shared goal for testing
        goal_data = {
            "title": "Community Challenge",
            "category": "fitness",
            "goalPattern": "milestone",
            "target": {
                "metric": "count",
                "value": 10000,
                "unit": "steps",
                "direction": "increase",
                "targetDate": "2024-12-31"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 201
        goal_id = response.json()["goalId"]
        
        # Simulate 50 concurrent activity logs
        num_activities = 50
        
        def log_activity(index: int) -> Dict[str, Any]:
            """Log a single activity."""
            activity = {
                "value": 100 + index,
                "unit": "steps",
                "activityType": "progress",
                "note": f"Activity {index}"
            }
            
            start = time.time()
            response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                     json=activity,
                                     headers=auth_headers)
            duration = time.time() - start
            
            return {
                "status": response.status_code,
                "duration": duration,
                "index": index
            }
        
        # Execute burst
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(log_activity, i) for i in range(num_activities)]
            results = [future.result() for future in as_completed(futures)]
        
        burst_time = time.time() - start_time
        
        # Verify all activities were logged
        response = api_client.get(f"/v1/goals/{goal_id}/activities?limit=100",
                                headers=auth_headers)
        assert response.status_code == 200
        activities = response.json()
        
        # Analyze results
        successful = sum(1 for r in results if r["status"] == 201)
        avg_duration = sum(r["duration"] for r in results) / len(results)
        
        print(f"\nActivity Logging Burst Results:")
        print(f"  Total activities: {num_activities}")
        print(f"  Successful: {successful}")
        print(f"  Burst duration: {burst_time:.2f}s")
        print(f"  Avg response time: {avg_duration*1000:.2f}ms")
        print(f"  Throughput: {num_activities/burst_time:.2f} activities/s")
        
        assert successful == num_activities
        assert activities["pagination"]["total"] >= num_activities
        assert avg_duration < 0.3  # Under 300ms average
    
    def test_progress_calculation_performance(self, api_client, auth_headers):
        """Test progress calculation performance with many activities."""
        # Create a goal
        goal_data = {
            "title": "Performance Test - Many Activities",
            "category": "test",
            "goalPattern": "recurring",
            "target": {
                "metric": "count",
                "value": 100,
                "unit": "items",
                "period": "day",
                "direction": "increase"
            }
        }
        
        response = api_client.post("/v1/goals", 
                                 json=goal_data,
                                 headers=auth_headers)
        assert response.status_code == 201
        goal_id = response.json()["goalId"]
        
        # Log many activities over multiple days
        activities_per_day = 20
        num_days = 30
        
        for day in range(num_days):
            date_str = (date(2024, 1, 1) + timedelta(days=day)).isoformat()
            
            for i in range(activities_per_day):
                activity = {
                    "value": 5,
                    "unit": "items",
                    "activityType": "progress",
                    "activityDate": date_str
                }
                
                response = api_client.post(f"/v1/goals/{goal_id}/activities",
                                         json=activity,
                                         headers=auth_headers)
                assert response.status_code == 201
        
        # Test progress calculation performance for different periods
        periods = ["current", "week", "month", "quarter", "year", "all"]
        
        print(f"\nProgress Calculation Performance (with {num_days * activities_per_day} activities):")
        for period in periods:
            start = time.time()
            response = api_client.get(f"/v1/goals/{goal_id}/progress?period={period}",
                                    headers=auth_headers)
            duration = time.time() - start
            
            assert response.status_code == 200
            progress = response.json()
            
            print(f"  {period}: {duration*1000:.2f}ms")
            assert duration < 0.5  # All calculations under 500ms
    
    def test_list_goals_with_filters_performance(self, api_client):
        """Test listing goals with various filters."""
        # Create many goals with different attributes
        user_headers = {
            "Authorization": "Bearer perf-test-token",
            "X-User-ID": str(uuid.uuid4())
        }
        
        patterns = ["recurring", "milestone", "target", "streak", "limit"]
        statuses = ["active", "paused", "completed"]
        categories = ["fitness", "health", "education", "finance", "personal"]
        
        # Create 100 goals with varied attributes
        for i in range(100):
            goal_data = {
                "title": f"Performance Goal {i+1}",
                "category": categories[i % len(categories)],
                "goalPattern": patterns[i % len(patterns)],
                "status": statuses[i % len(statuses)] if i % 10 == 0 else "active",
                "target": {
                    "metric": "count",
                    "value": 100,
                    "unit": "items",
                    "period": "day" if patterns[i % len(patterns)] in ["recurring", "limit"] else None,
                    "targetDate": "2024-12-31" if patterns[i % len(patterns)] in ["milestone", "target"] else None,
                    "direction": "increase"
                }
            }
            
            response = api_client.post("/v1/goals", 
                                     json=goal_data,
                                     headers=user_headers)
            assert response.status_code == 201
        
        # Test various filter combinations
        filter_tests = [
            {},  # No filters
            {"status": "active"},
            {"goalPattern": "recurring"},
            {"category": "fitness"},
            {"status": "active", "goalPattern": "recurring"},
            {"status": ["active", "paused"], "category": ["fitness", "health"]},
            {"sort": "created_desc"},
            {"sort": "title_asc"},
            {"limit": "50"},
            {"page": "2", "limit": "20"}
        ]
        
        print(f"\nList Goals Filter Performance:")
        for filters in filter_tests:
            query_string = "&".join([f"{k}={v}" for k, v in filters.items()])
            
            start = time.time()
            response = api_client.get(f"/v1/goals?{query_string}",
                                    headers=user_headers)
            duration = time.time() - start
            
            assert response.status_code == 200
            result = response.json()
            
            print(f"  Filters {filters}: {duration*1000:.2f}ms ({len(result['goals'])} goals)")
            assert duration < 0.3  # All queries under 300ms
    
    async def test_async_concurrent_operations(self, api_client):
        """Test various operations happening concurrently (async)."""
        base_url = "http://localhost:4000/v1"
        
        async def create_goal(session: aiohttp.ClientSession, user_id: str) -> str:
            """Async create goal."""
            headers = {
                "Authorization": f"Bearer user-{user_id}-token",
                "X-User-ID": user_id
            }
            
            goal_data = {
                "title": f"Async Goal for {user_id}",
                "category": "test",
                "goalPattern": "recurring",
                "target": {
                    "metric": "count",
                    "value": 10,
                    "unit": "items",
                    "period": "day",
                    "direction": "increase"
                }
            }
            
            async with session.post(f"{base_url}/goals", 
                                   json=goal_data,
                                   headers=headers) as response:
                data = await response.json()
                return data["goalId"]
        
        async def log_activity(session: aiohttp.ClientSession, 
                             user_id: str, 
                             goal_id: str,
                             value: int) -> int:
            """Async log activity."""
            headers = {
                "Authorization": f"Bearer user-{user_id}-token",
                "X-User-ID": user_id
            }
            
            activity = {
                "value": value,
                "unit": "items",
                "activityType": "progress"
            }
            
            async with session.post(f"{base_url}/goals/{goal_id}/activities",
                                   json=activity,
                                   headers=headers) as response:
                return response.status
        
        async def get_progress(session: aiohttp.ClientSession,
                             user_id: str,
                             goal_id: str) -> Dict[str, Any]:
            """Async get progress."""
            headers = {
                "Authorization": f"Bearer user-{user_id}-token",
                "X-User-ID": user_id
            }
            
            async with session.get(f"{base_url}/goals/{goal_id}/progress",
                                  headers=headers) as response:
                return await response.json()
        
        # Run concurrent operations
        async with aiohttp.ClientSession() as session:
            # Create goals for 10 users
            user_ids = [str(uuid.uuid4()) for _ in range(10)]
            
            # Phase 1: Create goals
            goal_tasks = [create_goal(session, uid) for uid in user_ids]
            goal_ids = await asyncio.gather(*goal_tasks)
            
            # Phase 2: Log activities concurrently
            activity_tasks = []
            for i, (uid, gid) in enumerate(zip(user_ids, goal_ids)):
                for j in range(5):
                    activity_tasks.append(log_activity(session, uid, gid, j+1))
            
            activity_results = await asyncio.gather(*activity_tasks)
            
            # Phase 3: Get progress for all goals
            progress_tasks = [get_progress(session, uid, gid) 
                            for uid, gid in zip(user_ids, goal_ids)]
            progress_results = await asyncio.gather(*progress_tasks)
            
            # Verify results
            assert all(status == 201 for status in activity_results)
            assert all(p["progress"]["currentPeriodValue"] == 15 
                      for p in progress_results)


class GoalLoadTest(HttpUser):
    """Locust load test for goal system."""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Set up user session."""
        self.user_id = str(uuid.uuid4())
        self.headers = {
            "Authorization": f"Bearer load-test-{self.user_id}",
            "X-User-ID": self.user_id,
            "Content-Type": "application/json"
        }
        self.goal_ids = []
        
        # Create initial goals
        for i in range(3):
            self.create_goal()
    
    def create_goal(self):
        """Create a new goal."""
        goal_data = {
            "title": f"Load Test Goal {len(self.goal_ids) + 1}",
            "category": "fitness",
            "goalPattern": "recurring",
            "target": {
                "metric": "count",
                "value": 100,
                "unit": "reps",
                "period": "day",
                "direction": "increase"
            }
        }
        
        with self.client.post("/v1/goals",
                            json=goal_data,
                            headers=self.headers,
                            catch_response=True) as response:
            if response.status_code == 201:
                goal_id = response.json()["goalId"]
                self.goal_ids.append(goal_id)
                response.success()
            else:
                response.failure(f"Failed to create goal: {response.status_code}")
    
    @task(5)
    def list_goals(self):
        """List user's goals."""
        self.client.get("/v1/goals",
                       headers=self.headers,
                       name="/v1/goals [LIST]")
    
    @task(3)
    def get_goal_detail(self):
        """Get a specific goal."""
        if self.goal_ids:
            goal_id = self.goal_ids[0]
            self.client.get(f"/v1/goals/{goal_id}",
                          headers=self.headers,
                          name="/v1/goals/{goalId} [GET]")
    
    @task(10)
    def log_activity(self):
        """Log activity on a goal."""
        if self.goal_ids:
            goal_id = self.goal_ids[0]
            activity = {
                "value": 10,
                "unit": "reps",
                "activityType": "progress"
            }
            
            self.client.post(f"/v1/goals/{goal_id}/activities",
                           json=activity,
                           headers=self.headers,
                           name="/v1/goals/{goalId}/activities [POST]")
    
    @task(2)
    def get_progress(self):
        """Get goal progress."""
        if self.goal_ids:
            goal_id = self.goal_ids[0]
            self.client.get(f"/v1/goals/{goal_id}/progress",
                          headers=self.headers,
                          name="/v1/goals/{goalId}/progress [GET]")
    
    @task(1)
    def update_goal(self):
        """Update a goal."""
        if self.goal_ids:
            goal_id = self.goal_ids[0]
            update_data = {
                "description": f"Updated at {datetime.now().isoformat()}"
            }
            
            self.client.put(f"/v1/goals/{goal_id}",
                          json=update_data,
                          headers=self.headers,
                          name="/v1/goals/{goalId} [PUT]")

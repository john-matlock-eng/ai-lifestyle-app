import uuid
import pytest

class TestGoalModuleFilter:
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": "Bearer test-token", "X-User-ID": str(uuid.uuid4())}

    @pytest.fixture
    def api_client(self, test_client):
        return test_client

    def test_filter_journal_goals(self, api_client, auth_headers):
        goal_data = {
            "title": "Journal Daily",
            "category": "wellness",
            "goalPattern": "streak",
            "target": {"metric": "count", "value": 1, "unit": "entry", "period": "day", "direction": "increase"}
        }
        resp = api_client.post("/v1/goals", json=goal_data, headers=auth_headers)
        assert resp.status_code == 201
        goal_id = resp.json()["goalId"]

        resp = api_client.patch(f"/v1/goals/{goal_id}", json={"module": "journal"}, headers=auth_headers)
        assert resp.status_code == 200

        other_data = goal_data | {"title": "Workout"}
        resp2 = api_client.post("/v1/goals", json=other_data, headers=auth_headers)
        assert resp2.status_code == 201

        resp = api_client.get("/v1/goals?module=journal", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        ids = [g["goalId"] for g in data["goals"]]
        assert goal_id in ids
        assert resp2.json()["goalId"] not in ids

import uuid
import pytest

class TestGoalModuleFilter:
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": "Bearer test", "X-User-ID": str(uuid.uuid4())}

    @pytest.fixture
    def api_client(self, test_client):
        return test_client

    def test_filter_journal_goals(self, api_client, auth_headers):
        goal1 = {
            "title": "Journal streak",
            "category": "wellness",
            "goalPattern": "streak",
            "target": {"metric": "count", "value": 1, "unit": "entry", "period": "day", "direction": "increase"},
            "module": "journal"
        }
        goal2 = {
            "title": "Other goal",
            "category": "fitness",
            "goalPattern": "streak",
            "target": {"metric": "count", "value": 1, "unit": "rep", "period": "day", "direction": "increase"}
        }
        r1 = api_client.post("/v1/goals", json=goal1, headers=auth_headers)
        assert r1.status_code == 201
        r2 = api_client.post("/v1/goals", json=goal2, headers=auth_headers)
        assert r2.status_code == 201
        resp = api_client.get("/v1/goals?module=journal", headers=auth_headers)
        assert resp.status_code == 200
        goals = resp.json()["goals"]
        assert len(goals) == 1
        assert goals[0]["module"] == "journal"

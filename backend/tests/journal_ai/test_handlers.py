import json
from unittest.mock import Mock, patch

from reflect.handler import lambda_handler as reflect_handler
from analyze_mood.handler import lambda_handler as analyze_mood_handler
from summarize_week.handler import lambda_handler as summarize_week_handler
import journal_ai.models


class DummyContext:
    aws_request_id = "test-req"


def test_reflect():
    event = {"httpMethod": "POST", "path": "/ai/reflect", "body": json.dumps({"entryId": "e1", "sectionId": "s1", "text": "hello", "prompt": "why"})}
    with patch("journal_ai.service.JournalAIService.reflect", return_value=journal_ai.models.ReflectResponse(reply="ok")):
        res = reflect_handler(event, DummyContext())
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert body["reply"] == "ok"

def test_analyze_mood():
    event = {"httpMethod": "POST", "path": "/ai/analyze-mood", "body": json.dumps({"entryId": "e1", "markdown": "hey"})}
    with patch("journal_ai.service.JournalAIService.analyze_mood", return_value=journal_ai.models.AnalyzeMoodResponse(emotions={"joy":1.0})):
        res = analyze_mood_handler(event, DummyContext())
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert "joy" in body["emotions"]

def test_summarize_week():
    event = {"httpMethod": "POST", "path": "/ai/summarize-week", "body": json.dumps({"userId": "u1", "entries": [{"id": "e1", "markdown": "a"}]})}
    with patch("journal_ai.service.JournalAIService.summarize_week", return_value=journal_ai.models.SummarizeWeekResponse(summary="s", highlights=[])):
        res = summarize_week_handler(event, DummyContext())
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert "summary" in body

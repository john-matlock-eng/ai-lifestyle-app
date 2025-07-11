from .openai_client import OpenAIClient
from . import models


class JournalAIService:
    def __init__(self, client: OpenAIClient | None = None):
        self.client = client or OpenAIClient()

    def reflect(self, request: models.ReflectRequest) -> models.ReflectResponse:
        reply = self.client.reflect(
            request.entryId, request.sectionId, request.text, request.prompt
        )
        return models.ReflectResponse(reply=reply)

    def analyze_mood(self, request: models.AnalyzeMoodRequest) -> models.AnalyzeMoodResponse:
        emotions = self.client.analyze_mood(request.entryId, request.markdown)
        return models.AnalyzeMoodResponse(emotions=emotions)

    def summarize_week(self, request: models.SummarizeWeekRequest) -> models.SummarizeWeekResponse:
        summary_dict = self.client.summarize_week(
            request.userId,
            [e.model_dump() for e in request.entries]
        )
        return models.SummarizeWeekResponse(**summary_dict)

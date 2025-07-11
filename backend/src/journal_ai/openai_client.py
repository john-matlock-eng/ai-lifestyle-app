class OpenAIClient:
    """Placeholder client for OpenAI or Bedrock."""

    def reflect(self, entry_id: str, section_id: str, text: str, prompt: str) -> str:
        return "This is a reflection response"

    def analyze_mood(self, entry_id: str, markdown: str) -> dict:
        return {"joy": 0.5, "sadness": 0.2}

    def summarize_week(self, user_id: str, entries: list[dict]) -> dict:
        return {"summary": "Week summary", "highlights": ["Item 1", "Item 2"]}

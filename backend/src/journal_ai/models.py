from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel
from typing import List, Dict


class ReflectRequest(BaseModel):
    entryId: str
    sectionId: str
    text: str
    prompt: str

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ReflectResponse(BaseModel):
    reply: str

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AnalyzeMoodRequest(BaseModel):
    entryId: str
    markdown: str

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AnalyzeMoodResponse(BaseModel):
    emotions: Dict[str, float]

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class JournalEntry(BaseModel):
    id: str
    markdown: str

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class SummarizeWeekRequest(BaseModel):
    userId: str
    entries: List[JournalEntry]

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class SummarizeWeekResponse(BaseModel):
    summary: str
    highlights: List[str]

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

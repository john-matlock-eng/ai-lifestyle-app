"""
Core models for the Journal System.

These models support journaling functionality with templates, goal linking,
encryption, and comprehensive analytics.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from pydantic.alias_generators import to_camel
from enum import Enum


class JournalTemplate(str, Enum):
    """Supported journal templates."""
    DAILY_REFLECTION = "daily_reflection"
    GRATITUDE = "gratitude"
    GOAL_PROGRESS = "goal_progress"
    MOOD_TRACKER = "mood_tracker"
    HABIT_TRACKER = "habit_tracker"
    CREATIVE_WRITING = "creative_writing"
    BLANK = "blank"


class GoalProgress(BaseModel):
    """Progress tracking for a specific goal within a journal entry."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    goal_id: str
    progress_value: Optional[float] = None
    notes: Optional[str] = Field(None, max_length=500)
    completed: bool = False


class JournalEntry(BaseModel):
    """Journal entry model with encryption and goal linking support."""
    model_config = ConfigDict(
        populate_by_name=True, 
        alias_generator=to_camel,
        json_encoders={datetime: lambda v: v.isoformat() if v else None}
    )
    
    # Identification
    entry_id: str = Field(..., description="Unique entry identifier")
    user_id: str = Field(..., description="User who owns this entry")
    
    # Core Content
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., description="The journal entry content (may be encrypted)")
    template: JournalTemplate = Field(default=JournalTemplate.BLANK)
    word_count: int = Field(0, ge=0, description="Word count (client-provided for encrypted content)")
    
    # Organization
    tags: List[str] = Field(default_factory=list, description="User-defined tags")
    mood: Optional[str] = Field(None, max_length=50, description="Mood/emotion tag")
    
    # Goal Integration
    linked_goal_ids: List[str] = Field(default_factory=list, description="Goals linked to this entry")
    goal_progress: List[GoalProgress] = Field(default_factory=list, description="Goal progress updates")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Privacy & Security
    is_encrypted: bool = Field(True, description="Whether content is encrypted")
    is_shared: bool = Field(False, description="Whether entry is shared with others")
    encrypted_key: Optional[str] = Field(None, description="Encrypted content key (base64)")
    shared_with: List[str] = Field(default_factory=list, description="User IDs this entry is shared with")
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        """Validate tags list."""
        if v:
            # Remove duplicates and empty strings
            v = list(set(tag.strip() for tag in v if tag.strip()))
            # Limit number of tags
            if len(v) > 20:
                raise ValueError("Maximum 20 tags allowed")
            # Validate tag length
            for tag in v:
                if len(tag) > 30:
                    raise ValueError("Tag length cannot exceed 30 characters")
        return v
    
    @field_validator('word_count')
    @classmethod
    def validate_word_count(cls, v, values):
        """Validate word count - must be provided by client for encrypted content."""
        # For encrypted content, word count must be provided by the client
        # since the server cannot calculate it from encrypted text
        if v < 0:
            raise ValueError("Word count must be non-negative")
        return v
    
    @model_validator(mode='after')
    def ensure_timezone_aware(self):
        """Ensure all datetime fields are timezone-aware."""
        if self.created_at and self.created_at.tzinfo is None:
            self.created_at = self.created_at.replace(tzinfo=timezone.utc)
        
        if self.updated_at and self.updated_at.tzinfo is None:
            self.updated_at = self.updated_at.replace(tzinfo=timezone.utc)
        
        return self
    
    @model_validator(mode='after')
    def validate_goal_consistency(self):
        """Ensure goal_progress matches linked_goal_ids."""
        progress_goal_ids = {gp.goal_id for gp in self.goal_progress}
        linked_goal_ids_set = set(self.linked_goal_ids)
        
        # All progress entries should reference linked goals
        if not progress_goal_ids.issubset(linked_goal_ids_set):
            extra_goals = progress_goal_ids - linked_goal_ids_set
            raise ValueError(f"Goal progress references unlinked goals: {extra_goals}")
        
        return self


class TemplateUsage(BaseModel):
    """Usage statistics for a specific template."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    template: JournalTemplate
    count: int = 0
    last_used: Optional[datetime] = None


class JournalStats(BaseModel):
    """Comprehensive journal statistics."""
    model_config = ConfigDict(
        populate_by_name=True, 
        alias_generator=to_camel,
        json_encoders={datetime: lambda v: v.isoformat() if v else None}
    )
    
    # Overall Statistics
    total_entries: int = Field(0, ge=0)
    total_words: int = Field(0, ge=0)
    
    # Streak Tracking
    current_streak: int = Field(0, ge=0, description="Current consecutive days with entries")
    longest_streak: int = Field(0, ge=0, description="Longest consecutive days streak")
    last_entry_date: Optional[datetime] = None
    
    # Goal Integration
    goals_tracked: int = Field(0, ge=0, description="Number of goals mentioned in entries")
    goals_completed: int = Field(0, ge=0, description="Goals completed through journal tracking")
    
    # Template Usage
    template_usage: List[TemplateUsage] = Field(default_factory=list)
    
    # Recent Activity
    entries_this_week: int = Field(0, ge=0)
    entries_this_month: int = Field(0, ge=0)
    average_words_per_entry: float = Field(0.0, ge=0.0)
    
    @model_validator(mode='after')
    def ensure_timezone_aware(self):
        """Ensure datetime fields are timezone-aware."""
        if self.last_entry_date and self.last_entry_date.tzinfo is None:
            self.last_entry_date = self.last_entry_date.replace(tzinfo=timezone.utc)
        
        # Fix template usage dates
        for usage in self.template_usage:
            if usage.last_used and usage.last_used.tzinfo is None:
                usage.last_used = usage.last_used.replace(tzinfo=timezone.utc)
        
        return self
    
    @model_validator(mode='after')
    def calculate_average_words(self):
        """Calculate average words per entry."""
        if self.total_entries > 0:
            self.average_words_per_entry = self.total_words / self.total_entries
        else:
            self.average_words_per_entry = 0.0
        return self


class CreateJournalEntryRequest(BaseModel):
    """Request to create a new journal entry."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., description="The journal entry content (may be encrypted)")
    template: JournalTemplate = Field(default=JournalTemplate.BLANK)
    word_count: Optional[int] = Field(None, ge=0, description="Word count (required if content is encrypted)")
    
    tags: Optional[List[str]] = Field(None, description="User-defined tags")
    mood: Optional[str] = Field(None, max_length=50, description="Mood/emotion tag")
    
    # Goal Integration
    linked_goal_ids: Optional[List[str]] = Field(None, description="Goals to link to this entry")
    goal_progress: Optional[List[GoalProgress]] = Field(None, description="Goal progress updates")
    
    # Privacy Settings
    is_encrypted: bool = Field(True, description="Whether content is encrypted")
    encrypted_key: Optional[str] = Field(None, description="Encrypted content key (base64)")
    is_shared: bool = Field(False, description="Whether entry should be shared")
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        """Validate tags list."""
        if v:
            # Remove duplicates and empty strings
            v = list(set(tag.strip() for tag in v if tag.strip()))
            # Limit number of tags
            if len(v) > 20:
                raise ValueError("Maximum 20 tags allowed")
            # Validate tag length
            for tag in v:
                if len(tag) > 30:
                    raise ValueError("Tag length cannot exceed 30 characters")
        return v
    
    @model_validator(mode='after')
    def validate_encrypted_content(self):
        """Validate encrypted content has required fields."""
        if self.is_encrypted:
            if self.word_count is None:
                raise ValueError("Word count is required for encrypted content")
            if not self.encrypted_key:
                raise ValueError("Encrypted key is required for encrypted content")
        return self


class UpdateJournalEntryRequest(BaseModel):
    """Request to update an existing journal entry."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, description="The journal entry content (may be encrypted)")
    template: Optional[JournalTemplate] = None
    word_count: Optional[int] = Field(None, ge=0, description="Word count (required if content is encrypted)")
    
    tags: Optional[List[str]] = None
    mood: Optional[str] = Field(None, max_length=50)
    
    # Goal Integration
    linked_goal_ids: Optional[List[str]] = None
    goal_progress: Optional[List[GoalProgress]] = None
    
    # Privacy Settings
    is_encrypted: Optional[bool] = None
    encrypted_key: Optional[str] = Field(None, description="Encrypted content key (base64)")
    is_shared: Optional[bool] = None
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        """Validate tags list."""
        if v is not None:
            # Remove duplicates and empty strings
            v = list(set(tag.strip() for tag in v if tag.strip()))
            # Limit number of tags
            if len(v) > 20:
                raise ValueError("Maximum 20 tags allowed")
            # Validate tag length
            for tag in v:
                if len(tag) > 30:
                    raise ValueError("Tag length cannot exceed 30 characters")
        return v


class JournalListResponse(BaseModel):
    """Response containing a list of journal entries."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    entries: List[JournalEntry]
    total: int
    page: int
    limit: int
    has_more: bool = False
    
    @model_validator(mode='after')
    def calculate_has_more(self):
        """Calculate if there are more entries available."""
        if self.total > 0 and self.limit > 0:
            total_pages = (self.total + self.limit - 1) // self.limit
            self.has_more = self.page < total_pages
        else:
            self.has_more = False
        return self
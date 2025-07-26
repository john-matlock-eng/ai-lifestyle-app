"""
Public user info model for sharing features.
"""


from pydantic import BaseModel, Field


class UserPublicInfo(BaseModel):
    """Public user information model (for sharing features)."""

    userId: str = Field(
        ...,
        description="Unique user identifier",
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    )
    email: str = Field(..., description="User's email address")
    firstName: Optional[str] = Field(default=None, description="User's first name")
    lastName: Optional[str] = Field(default=None, description="User's last name")
    hasEncryption: bool = Field(default=False, description="Whether user has encryption set up")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "firstName": "Jane",
                "lastName": "Doe",
                "hasEncryption": True,
            }
        }

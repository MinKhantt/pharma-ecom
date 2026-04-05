from pydantic import BaseModel, model_validator
from uuid import UUID
from datetime import datetime
from typing import Optional

class ChatUserResponse(BaseModel):
    id: UUID
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def extract_avatar(cls, data):
        # Check if data is an object (SQLAlchemy)
        if hasattr(data, "profile") and data.profile:
            data.avatar_url = data.profile.avatar_url
        # Check if data is a dict (if manually passed)
        elif isinstance(data, dict) and "profile" in data and data["profile"]:
            data["avatar_url"] = data["profile"].get("avatar_url")
        return data
    
    model_config = {"from_attributes": True}

class MemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    role: str
    joined_at: datetime
    user: Optional[ChatUserResponse] = None

    model_config = {"from_attributes": True}

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
        if hasattr(data, "__dict__"):
            # Safely check __dict__ — won't trigger lazy load
            profile = data.__dict__.get("profile")
            if profile:
                data.avatar_url = getattr(profile, "avatar_url", None)
        elif isinstance(data, dict):
            profile = data.get("profile")
            if profile:
                data["avatar_url"] = profile.get("avatar_url") if isinstance(profile, dict) else getattr(profile, "avatar_url", None)
        return data
    
    model_config = {"from_attributes": True}

class MemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    role: str
    joined_at: datetime
    user: Optional[ChatUserResponse] = None

    model_config = {"from_attributes": True}

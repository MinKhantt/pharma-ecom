from pydantic import BaseModel, field_validator, model_validator
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


class MessageResponse(BaseModel):
    id: UUID
    content: str
    is_read: bool
    created_at: datetime
    updated_at: datetime
    sender_id: UUID
    conversation_id: UUID

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    members: list[MemberResponse] = []
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class ConversationSummaryResponse(BaseModel):
    id: UUID
    updated_at: datetime
    members: list[MemberResponse] = []

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message content cannot be empty")
        return v.strip()


class StartConversationRequest(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message cannot be empty")
        return v.strip()
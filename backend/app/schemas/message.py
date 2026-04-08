from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime


class MessageResponse(BaseModel):
    id: UUID
    content: str
    is_read: bool
    created_at: datetime
    updated_at: datetime
    sender_id: UUID
    conversation_id: UUID

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message content cannot be empty")
        return v.strip()

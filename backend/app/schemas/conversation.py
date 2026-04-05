from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
from typing import List
from .conversation_member import MemberResponse
from .message import MessageResponse


class ConversationResponse(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    members: List[MemberResponse] = []
    messages: List[MessageResponse] = []

    model_config = {"from_attributes": True}


class ConversationSummaryResponse(BaseModel):
    id: UUID
    updated_at: datetime
    members: List[MemberResponse] = []

    model_config = {"from_attributes": True}


class StartConversationRequest(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message cannot be empty")
        return v.strip()

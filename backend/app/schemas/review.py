from pydantic import BaseModel, field_validator, model_validator
from uuid import UUID
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    rating: int
    comment: str

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

    @field_validator("comment")
    @classmethod
    def comment_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Comment cannot be empty")
        return v.strip()


class ReviewAuthorResponse(BaseModel):
    id: UUID
    full_name: str
    avatar_url: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def extract_avatar(cls, data):
        if hasattr(data, "profile") and data.profile:
            data.avatar_url = data.profile.avatar_url
        return data

    model_config = {"from_attributes": True}


class ReviewResponse(BaseModel):
    id: UUID
    rating: int
    comment: str
    is_approved: bool
    created_at: datetime
    user_id: UUID
    user: Optional[ReviewAuthorResponse] = None

    model_config = {"from_attributes": True}


class ReviewListResponse(BaseModel):
    items: list[ReviewResponse]
    total: int

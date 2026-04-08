from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional
import re


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


class ArticleAuthorResponse(BaseModel):
    id: UUID
    full_name: str
    model_config = {"from_attributes": True}


class ArticleCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    category: str = "news"
    is_published: bool = False

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("category")
    @classmethod
    def valid_category(cls, v: str) -> str:
        valid = {"news", "health_tips", "medicine_info"}
        if v not in valid:
            raise ValueError(f"Category must be one of {valid}")
        return v


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None


class ArticleResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    content: str
    excerpt: Optional[str]
    cover_image_url: Optional[str]
    category: str
    is_published: bool
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    author: Optional[ArticleAuthorResponse] = None

    model_config = {"from_attributes": True}


class ArticleListResponse(BaseModel):
    items: list[ArticleResponse]
    total: int
    skip: int
    limit: int

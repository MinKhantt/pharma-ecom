import uuid
import enum
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base


class ArticleCategory(str, enum.Enum):
    NEWS         = "news"
    HEALTH_TIPS  = "health_tips"
    MEDICINE_INFO = "medicine_info"


class Article(Base):
    __tablename__ = "articles"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title           = Column(String(255), nullable=False)
    slug            = Column(String(255), nullable=False, unique=True, index=True)
    content         = Column(Text, nullable=False)
    excerpt         = Column(Text, nullable=True)
    cover_image_url = Column(String, nullable=True)
    category        = Column(String(50), nullable=False, default=ArticleCategory.NEWS)
    is_published    = Column(Boolean, nullable=False, default=False)
    published_at    = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    author = relationship("User", lazy="noload")
import uuid
import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base


class ShopReview(Base):
    __tablename__ = "shop_reviews"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rating     = Column(Integer, nullable=False)
    comment    = Column(String, nullable=False)
    is_approved = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # one review per user
    )

    user = relationship("User", lazy="noload")

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="rating_range"),
    )
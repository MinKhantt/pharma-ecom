import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    ForeignKey,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    url = Column(String(500), nullable=False)  # S3 / CDN URL (not raw bytes)
    is_primary = Column(Boolean, server_default="FALSE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    product = relationship("Product", back_populates="images")

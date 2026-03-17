from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name cannot be empty")
        return v.strip()


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]

    model_config = {"from_attributes": True}


# ── Product Image ─────────────────────────────────────────────────────────────

class ProductImageResponse(BaseModel):
    id: UUID
    file_name: str
    file_type: Optional[str]
    url: str
    is_primary: bool

    model_config = {"from_attributes": True}


# ── Product ───────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    manufacturer: Optional[str] = None
    price: Decimal
    inventory: int = 0
    description: Optional[str] = None
    requires_prescription: bool = False
    category_id: UUID

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name cannot be empty")
        return v.strip()

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("price must be greater than 0")
        return v

    @field_validator("inventory")
    @classmethod
    def inventory_not_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("inventory cannot be negative")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    manufacturer: Optional[str] = None
    price: Optional[Decimal] = None
    inventory: Optional[int] = None
    description: Optional[str] = None
    requires_prescription: Optional[bool] = None
    category_id: Optional[UUID] = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("price must be greater than 0")
        return v

    @field_validator("inventory")
    @classmethod
    def inventory_not_negative(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("inventory cannot be negative")
        return v


class ProductResponse(BaseModel):
    id: UUID
    name: str
    manufacturer: Optional[str]
    price: Decimal
    inventory: int
    description: Optional[str]
    requires_prescription: bool
    created_at: datetime
    updated_at: datetime
    category: CategoryResponse
    images: list[ProductImageResponse] = []

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    skip: int
    limit: int
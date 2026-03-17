from pydantic import BaseModel, field_validator
from uuid import UUID
from decimal import Decimal
from typing import Optional
from app.schemas.product import ProductResponse


class CartItemAdd(BaseModel):
    product_id: UUID
    quantity: int = 1

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("quantity must be at least 1")
        return v


class CartItemUpdate(BaseModel):
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("quantity must be at least 1")
        return v


class CartItemResponse(BaseModel):
    id: UUID
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    product: ProductResponse

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    id: UUID
    total_amount: Decimal
    items: list[CartItemResponse] = []

    model_config = {"from_attributes": True}
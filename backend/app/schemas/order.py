from pydantic import BaseModel, field_validator
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import Optional
from app.models.order import OrderStatus
from app.schemas.product import ProductResponse


class OrderItemResponse(BaseModel):
    id: UUID
    quantity: int
    price: Decimal
    product: ProductResponse

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: UUID
    order_date: datetime
    total_amount: Decimal
    status: OrderStatus
    prescription_ref: Optional[str]
    delivery_address: Optional[str]
    notes: Optional[str]
    updated_at: datetime
    items: list[OrderItemResponse] = []

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    skip: int
    limit: int


class CheckoutRequest(BaseModel):
    delivery_address: str
    notes: Optional[str] = None

    @field_validator("delivery_address")
    @classmethod
    def address_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("delivery_address cannot be empty")
        return v.strip()


class UploadPrescriptionRequest(BaseModel):
    prescription_ref: str

    @field_validator("prescription_ref")
    @classmethod
    def ref_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("prescription_ref cannot be empty")
        return v.strip()


class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus
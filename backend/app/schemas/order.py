import enum

from pydantic import BaseModel, field_validator, model_validator
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from app.models.order import OrderStatus
from .order_item import OrderItemResponse


class OrderUserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone_number: Optional[str] = None
    address: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def extract_profile_info(cls, data):
        # If 'data' is a SQLAlchemy model instance
        if hasattr(data, "profile") and data.profile:
            data.phone_number = data.profile.phone_number
            data.address = data.profile.address
        return data

    class Config:
        from_attributes = True

class ReturnReason(str, enum.Enum):
    DAMAGED     = "damaged"
    WRONG_ITEM  = "wrong_item"
    NOT_SATISFIED = "not_satisfied"

class RequestReturnRequest(BaseModel):
    reason: ReturnReason
    note: Optional[str] = None

class ApproveRejectReturnRequest(BaseModel):
    approve: bool


class OrderResponse(BaseModel):
    id: UUID
    order_date: datetime
    total_amount: Decimal
    status: OrderStatus
    prescription_ref: Optional[str]
    delivery_address: Optional[str]
    notes: Optional[str]
    return_reason: Optional[str] = None
    return_note:   Optional[str] = None
    updated_at: datetime

    user: Optional[OrderUserResponse] = None

    items: List[OrderItemResponse] = []

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
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

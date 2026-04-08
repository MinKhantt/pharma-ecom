from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import Optional
from app.models.payment import PaymentMethod, PaymentStatus


class PaymentCreate(BaseModel):
    order_id: UUID
    method: PaymentMethod


class PaymentResponse(BaseModel):
    id: UUID
    amount: Decimal
    currency: str
    method: PaymentMethod
    status: PaymentStatus
    transaction_id: str
    paid_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    order_id: UUID

    model_config = {"from_attributes": True}


class RefundRequest(BaseModel):
    reason: Optional[str] = None

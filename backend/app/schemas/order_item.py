from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from typing import Optional
from app.schemas.product import ProductResponse

class OrderItemResponse(BaseModel):
    id: UUID
    quantity: int
    price: Decimal
    product: ProductResponse

    model_config = {"from_attributes": True}

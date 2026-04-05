from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from typing import List
from .cart_item import CartItemResponse


class CartResponse(BaseModel):
    id: UUID
    total_amount: Decimal
    items: List[CartItemResponse] = []

    model_config = {"from_attributes": True}

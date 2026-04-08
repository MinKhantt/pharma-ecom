from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional, List

from app.models.cart_item import CartItem
from app.crud.base import CRUDBase


class CartItemCRUD(CRUDBase[CartItem]):
    async def get_item(
        self, db: AsyncSession, cart_id: UUID, product_id: UUID
    ) -> Optional[CartItem]:
        result = await db.execute(
            select(CartItem).where(
                CartItem.cart_id == cart_id,
                CartItem.product_id == product_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_items_by_cart_id(
        self, db: AsyncSession, cart_id: UUID
    ) -> List[CartItem]:
        result = await db.execute(select(CartItem).where(CartItem.cart_id == cart_id))
        return result.scalars().all()


cart_item_crud = CartItemCRUD(CartItem)

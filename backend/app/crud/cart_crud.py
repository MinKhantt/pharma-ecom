from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product import Product
from app.crud.base import CRUDBase


class CartCRUD(CRUDBase[Cart]):

    def _base_query(self):
        return (
            select(Cart)
            .options(
                selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
                selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.category),
            )
        )

    async def get_by_user_id(self, db: AsyncSession, user_id: UUID) -> Optional[Cart]:
        result = await db.execute(
            self._base_query().where(Cart.user_id == user_id)
        )
        return result.scalar_one_or_none()


cart_crud = CartCRUD(Cart)

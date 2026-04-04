from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional, List

from app.models.cart import Cart, CartItem
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
        result = await db.execute(
            select(CartItem).where(CartItem.cart_id == cart_id)
        )
        return result.scalars().all()


cart_crud = CartCRUD(Cart)
cart_item_crud = CartItemCRUD(CartItem)

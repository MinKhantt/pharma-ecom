from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.cart import Cart, CartItem
from app.models.product import Product


class CartCRUD:

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

    async def get_item_by_id(
        self, db: AsyncSession, item_id: UUID
    ) -> Optional[CartItem]:
        result = await db.execute(
            select(CartItem).where(CartItem.id == item_id)
        )
        return result.scalar_one_or_none()

    async def add_item(self, db: AsyncSession, data: dict) -> CartItem:
        item = CartItem(**data)
        db.add(item)
        await db.flush()
        return item

    async def update_item(
        self, db: AsyncSession, item: CartItem, data: dict
    ) -> CartItem:
        for field, value in data.items():
            setattr(item, field, value)
        await db.flush()
        return item

    async def delete_item(self, db: AsyncSession, item: CartItem) -> None:
        await db.delete(item)
        await db.flush()

    async def clear(self, db: AsyncSession, cart: Cart) -> None:
        for item in cart.items:
            await db.delete(item)
        await db.flush()

    async def update_total(self, db: AsyncSession, cart: Cart) -> Cart:
        cart.recalculate_total()
        await db.flush()
        return cart


cart_crud = CartCRUD()
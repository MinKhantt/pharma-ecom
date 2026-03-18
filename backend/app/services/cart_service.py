from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from uuid import UUID

from app.crud.cart_crud import cart_crud
from app.crud.product_crud import product_crud
from app.schemas.cart import CartItemAdd, CartItemUpdate
from app.models.cart import Cart, CartItem


class CartService:

    async def _recalculate_and_save(self, db: AsyncSession, cart_id: UUID) -> None:
        """Re-fetch all cart items and recalculate total_amount correctly."""
        result = await db.execute(
            select(CartItem).where(CartItem.cart_id == cart_id)
        )
        all_items = result.scalars().all()

        total = sum(
            (item.unit_price or Decimal(0)) * item.quantity
            for item in all_items
        )

        cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
        cart = cart_result.scalar_one()
        cart.total_amount = total
        await db.flush()

    async def get_cart(self, db: AsyncSession, user_id: UUID) -> Cart:
        cart = await cart_crud.get_by_user_id(db, user_id)
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )
        return cart

    async def add_item(
        self, db: AsyncSession, user_id: UUID, data: CartItemAdd
    ) -> Cart:
        cart = await cart_crud.get_by_user_id(db, user_id)
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )

        product = await product_crud.get_by_id(db, data.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        if product.inventory < data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough inventory. Available: {product.inventory}",
            )

        existing_item = await cart_crud.get_item(db, cart.id, data.product_id)
        if existing_item:
            new_quantity = existing_item.quantity + data.quantity
            if product.inventory < new_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Not enough inventory. Available: {product.inventory}",
                )
            existing_item.quantity = new_quantity
            existing_item.total_price = existing_item.unit_price * new_quantity
            await db.flush()
        else:
            new_item = CartItem(
                cart_id=cart.id,
                product_id=data.product_id,
                quantity=data.quantity,
                unit_price=product.price,
                total_price=product.price * data.quantity,
            )
            db.add(new_item)
            await db.flush()

        await self._recalculate_and_save(db, cart.id)
        await db.commit()
        return await cart_crud.get_by_user_id(db, user_id)

    async def update_item(
        self, db: AsyncSession, user_id: UUID, item_id: UUID, data: CartItemUpdate
    ) -> Cart:
        cart = await cart_crud.get_by_user_id(db, user_id)
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )

        item = await cart_crud.get_item_by_id(db, item_id)
        if not item or item.cart_id != cart.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        product = await product_crud.get_by_id(db, item.product_id)
        if product.inventory < data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough inventory. Available: {product.inventory}",
            )

        item.quantity = data.quantity
        item.total_price = item.unit_price * data.quantity
        await db.flush()

        await self._recalculate_and_save(db, cart.id)
        await db.commit()
        return await cart_crud.get_by_user_id(db, user_id)

    async def remove_item(
        self, db: AsyncSession, user_id: UUID, item_id: UUID
    ) -> Cart:
        cart = await cart_crud.get_by_user_id(db, user_id)
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )

        item = await cart_crud.get_item_by_id(db, item_id)
        if not item or item.cart_id != cart.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        await cart_crud.delete_item(db, item)
        await self._recalculate_and_save(db, cart.id)
        await db.commit()
        return await cart_crud.get_by_user_id(db, user_id)

    async def clear_cart(self, db: AsyncSession, user_id: UUID) -> Cart:
        cart = await cart_crud.get_by_user_id(db, user_id)
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )

        await cart_crud.clear(db, cart)
        await self._recalculate_and_save(db, cart.id)
        await db.commit()
        return await cart_crud.get_by_user_id(db, user_id)


cart_service = CartService()
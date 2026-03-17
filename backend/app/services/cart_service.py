from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from uuid import UUID

from app.crud.cart_crud import cart_crud
from app.crud.product_crud import product_crud
from app.schemas.cart import CartItemAdd, CartItemUpdate
from app.models.cart import Cart


class CartService:

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
        # Get cart
        cart = await cart_crud.get_by_user_id(db, user_id)
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )

        # Validate product exists and has enough inventory
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

        # Check if item already in cart — if so, update quantity
        existing_item = await cart_crud.get_item(db, cart.id, data.product_id)
        if existing_item:
            new_quantity = existing_item.quantity + data.quantity
            if product.inventory < new_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Not enough inventory. Available: {product.inventory}",
                )
            existing_item.quantity = new_quantity
            existing_item.update_total()
            await db.flush()
        else:
            await cart_crud.add_item(db, {
                "cart_id": cart.id,
                "product_id": data.product_id,
                "quantity": data.quantity,
                "unit_price": product.price,
                "total_price": product.price * data.quantity,
            })

        await cart_crud.update_total(db, cart)
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

        # Validate inventory
        product = await product_crud.get_by_id(db, item.product_id)
        if product.inventory < data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough inventory. Available: {product.inventory}",
            )

        item.quantity = data.quantity
        item.update_total()
        await db.flush()
        await cart_crud.update_total(db, cart)
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
        await cart_crud.update_total(db, cart)
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
        await cart_crud.update_total(db, cart)
        await db.commit()
        return await cart_crud.get_by_user_id(db, user_id)


cart_service = CartService()
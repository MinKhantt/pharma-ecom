from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from uuid import UUID

from app.crud.cart_crud import cart_crud, cart_item_crud
from app.crud.product_crud import product_crud
from app.schemas.cart import CartItemAdd, CartItemUpdate
from app.models.cart import Cart


class CartService:

    async def _recalculate_and_save(self, db: AsyncSession, cart: Cart) -> None:
        """Re-fetch all cart items and recalculate total_amount correctly."""
        all_items = await cart_item_crud.get_items_by_cart_id(db, cart.id)

        total = sum(
            (item.unit_price or Decimal(0)) * item.quantity
            for item in all_items
        )

        await cart_crud.update(db, db_obj=cart, obj_in={"total_amount": total})

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

        existing_item = await cart_item_crud.get_item(db, cart.id, data.product_id)
        if existing_item:
            new_quantity = existing_item.quantity + data.quantity
            if product.inventory < new_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Not enough inventory. Available: {product.inventory}",
                )
            
            await cart_item_crud.update(
                db, 
                db_obj=existing_item, 
                obj_in={
                    "quantity": new_quantity,
                    "total_price": existing_item.unit_price * new_quantity
                }
            )
        else:
            await cart_item_crud.create(
                db,
                obj_in={
                    "cart_id": cart.id,
                    "product_id": data.product_id,
                    "quantity": data.quantity,
                    "unit_price": product.price,
                    "total_price": product.price * data.quantity,
                }
            )

        await self._recalculate_and_save(db, cart)
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

        item = await cart_item_crud.get(db, item_id)
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

        await cart_item_crud.update(
            db,
            db_obj=item,
            obj_in={
                "quantity": data.quantity,
                "total_price": item.unit_price * data.quantity
            }
        )

        await self._recalculate_and_save(db, cart)
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

        item = await cart_item_crud.get(db, item_id)
        if not item or item.cart_id != cart.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        await cart_item_crud.delete(db, db_obj=item)
        await self._recalculate_and_save(db, cart)
        await db.commit()
        return await cart_crud.get_by_user_id(db, user_id)

    async def clear_cart(self, db: AsyncSession, user_id: UUID) -> Cart:
        cart = await cart_crud.get_by_user_id(db, user_id)
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )

        items = await cart_item_crud.get_items_by_cart_id(db, cart.id)
        for item in items:
            await cart_item_crud.delete(db, db_obj=item)
            
        await self._recalculate_and_save(db, cart)
        await db.commit()
        return await cart_crud.get_by_user_id(db, user_id)


cart_service = CartService()

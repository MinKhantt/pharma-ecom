from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status, UploadFile
from uuid import UUID
from typing import Optional
from decimal import Decimal

from app.crud.order_crud import order_crud
from app.crud.cart_crud import cart_crud
from app.crud.product_crud import product_crud
from app.models.order import Order, OrderStatus
from app.schemas.order import CheckoutRequest, UpdateOrderStatusRequest
from app.core.file_upload import save_upload_file


class OrderService:

    async def checkout(
        self, db: AsyncSession, user_id: UUID, data: CheckoutRequest
    ) -> Order:
        # Get cart with items
        cart = await cart_crud.get_by_user_id(db, user_id)
        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )

        # Check if any product requires prescription
        needs_prescription = any(
            item.product.requires_prescription for item in cart.items
        )

        # Validate inventory for all items
        for item in cart.items:
            product = await product_crud.get_by_id(db, item.product_id)
            if product.inventory < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Not enough inventory for {product.name}. Available: {product.inventory}",
                )

        # Create order
        order_status = (
            OrderStatus.AWAITING_PRESCRIPTION
            if needs_prescription
            else OrderStatus.PENDING
        )

        order = await order_crud.create(db, {
            "user_id": user_id,
            "total_amount": cart.total_amount,
            "status": order_status,
            "delivery_address": data.delivery_address,
            "notes": data.notes,
        })

        # Create order items and deduct inventory
        for item in cart.items:
            await order_crud.add_items(db, [{
                "order_id": order.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.unit_price,
            }])
            # Deduct inventory
            product = await product_crud.get_by_id(db, item.product_id)
            await product_crud.update(
                db, product, {"inventory": product.inventory - item.quantity}
            )

        # Clear cart after checkout
        await cart_crud.clear(db, cart)
        await cart_crud.update_total(db, cart)

        await db.commit()
        return await order_crud.get_by_id(db, order.id)

    async def upload_prescription(
        self,
        db: AsyncSession,
        user_id: UUID,
        order_id: UUID,
        file: UploadFile,
    ) -> Order:
        order = await order_crud.get_by_id(db, order_id)
        if not order or order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )
        if order.status != OrderStatus.AWAITING_PRESCRIPTION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order does not require a prescription",
            )

        file_name, file_type, url = await save_upload_file(file)
        await order_crud.update(db, order, {
            "prescription_ref": url,
            "status": OrderStatus.PENDING,
        })
        await db.commit()
        return await order_crud.get_by_id(db, order_id)

    async def get_my_orders(
        self,
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
        status: Optional[OrderStatus] = None,
    ) -> tuple[list[Order], int]:
        return await order_crud.get_by_user(
            db, user_id, skip=skip, limit=limit, status=status
        )

    async def get_my_order_by_id(
        self, db: AsyncSession, user_id: UUID, order_id: UUID
    ) -> Order:
        order = await order_crud.get_by_id(db, order_id)
        if not order or order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )
        return order

    async def cancel_order(
        self, db: AsyncSession, user_id: UUID, order_id: UUID
    ) -> Order:
        order = await order_crud.get_by_id(db, order_id)
        if not order or order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        # Only pending or awaiting prescription orders can be cancelled by customer
        cancellable = {OrderStatus.PENDING, OrderStatus.AWAITING_PRESCRIPTION}
        if order.status not in cancellable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel order with status: {order.status.value}",
            )

        # Restore inventory
        for item in order.items:
            product = await product_crud.get_by_id(db, item.product_id)
            if product:
                await product_crud.update(
                    db, product, {"inventory": product.inventory + item.quantity}
                )

        await order_crud.update(db, order, {"status": OrderStatus.CANCELLED})
        await db.commit()
        return await order_crud.get_by_id(db, order_id)

    # ── Admin ─────────────────────────────────────────────────────────────────

    async def get_all_orders(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        status: Optional[OrderStatus] = None,
    ) -> tuple[list[Order], int]:
        return await order_crud.get_all(db, skip=skip, limit=limit, status=status)

    async def get_order_by_id(
        self, db: AsyncSession, order_id: UUID
    ) -> Order:
        order = await order_crud.get_by_id(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )
        return order

    async def update_order_status(
        self,
        db: AsyncSession,
        order_id: UUID,
        data: UpdateOrderStatusRequest,
    ) -> Order:
        order = await order_crud.get_by_id(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )
        await order_crud.update(db, order, {"status": data.status})
        await db.commit()
        return await order_crud.get_by_id(db, order_id)


order_service = OrderService()
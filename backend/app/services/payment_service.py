from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from uuid import UUID
from datetime import datetime, timezone

from app.crud.payment_crud import payment_crud
from app.crud.order_crud import order_crud
from app.models.payment import Payment, PaymentStatus
from app.models.order import OrderStatus
from app.schemas.payment import PaymentCreate


class PaymentService:

    async def create_payment(
        self, db: AsyncSession, user_id: UUID, data: PaymentCreate
    ) -> Payment:
        # Verify order exists and belongs to user
        order = await order_crud.get_by_id(db, data.order_id)
        if not order or order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        # Order must be in PENDING state to accept payment
        if order.status not in {OrderStatus.PENDING, OrderStatus.CONFIRMED}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order cannot be paid in status: {order.status.value}",
            )

        # Check payment doesn't already exist for this order
        existing = await payment_crud.get_by_order_id(db, data.order_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment already exists for this order",
            )

        # Create payment — fake instant completion for school project
        payment = await payment_crud.create(db, {
            "order_id": data.order_id,
            "amount": order.total_amount,
            "currency": "MMK",
            "method": data.method,
            "status": PaymentStatus.COMPLETED,
            "paid_at": datetime.now(timezone.utc),
        })

        # Update order status to CONFIRMED after payment
        await order_crud.update(db, order, {"status": OrderStatus.CONFIRMED})

        await db.commit()
        await db.refresh(payment)
        return payment

    async def get_payment_by_order(
        self, db: AsyncSession, user_id: UUID, order_id: UUID
    ) -> Payment:
        order = await order_crud.get_by_id(db, order_id)
        if not order or order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        payment = await payment_crud.get_by_order_id(db, order_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )
        return payment

    async def refund_payment(
        self, db: AsyncSession, user_id: UUID, order_id: UUID
    ) -> Payment:
        order = await order_crud.get_by_id(db, order_id)
        if not order or order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        payment = await payment_crud.get_by_order_id(db, order_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )

        if payment.status != PaymentStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only completed payments can be refunded",
            )

        # Only refund if order is cancelled
        if order.status != OrderStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancel the order before requesting a refund",
            )

        await payment_crud.update(db, payment, {"status": PaymentStatus.REFUNDED})
        await order_crud.update(db, order, {"status": OrderStatus.REFUNDED})
        await db.commit()
        await db.refresh(payment)
        return payment

    # ── Admin ─────────────────────────────────────────────────────────────────

    async def get_payment_by_id(
        self, db: AsyncSession, payment_id: UUID
    ) -> Payment:
        payment = await payment_crud.get_by_id(db, payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )
        return payment

    async def admin_get_payment_by_order(
        self, db: AsyncSession, order_id: UUID
    ) -> Payment:
        payment = await payment_crud.get_by_order_id(db, order_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )
        return payment


payment_service = PaymentService()
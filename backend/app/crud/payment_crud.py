from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional

from app.models.payment import Payment


class PaymentCRUD:

    async def create(self, db: AsyncSession, data: dict) -> Payment:
        payment = Payment(**data)
        db.add(payment)
        await db.flush()
        return payment

    async def get_by_id(self, db: AsyncSession, payment_id: UUID) -> Optional[Payment]:
        result = await db.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_order_id(self, db: AsyncSession, order_id: UUID) -> Optional[Payment]:
        result = await db.execute(
            select(Payment).where(Payment.order_id == order_id)
        )
        return result.scalar_one_or_none()

    async def update(self, db: AsyncSession, payment: Payment, data: dict) -> Payment:
        for field, value in data.items():
            setattr(payment, field, value)
        await db.flush()
        return payment


payment_crud = PaymentCRUD()
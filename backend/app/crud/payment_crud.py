from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional

from app.models.payment import Payment
from app.crud.base import CRUDBase


class PaymentCRUD(CRUDBase[Payment]):

    async def get_by_order_id(self, db: AsyncSession, order_id: UUID) -> Optional[Payment]:
        result = await db.execute(
            select(Payment).where(Payment.order_id == order_id)
        )
        return result.scalar_one_or_none()


payment_crud = PaymentCRUD(Payment)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from uuid import UUID
from typing import List

from app.models.ai_chat import AIChatMessage
from app.crud.base import CRUDBase


class AIChatCRUD(CRUDBase[AIChatMessage]):

    async def get_history(
        self, db: AsyncSession, user_id: UUID, limit: int = 50
    ) -> List[AIChatMessage]:
        result = await db.execute(
            select(AIChatMessage)
            .where(AIChatMessage.user_id == user_id)
            .order_by(AIChatMessage.created_at.asc())
            .limit(limit)
        )
        return result.scalars().all()

    async def clear_history(self, db: AsyncSession, user_id: UUID) -> None:
        await db.execute(
            delete(AIChatMessage).where(AIChatMessage.user_id == user_id)
        )
        await db.flush()


ai_chat_crud = AIChatCRUD(AIChatMessage)
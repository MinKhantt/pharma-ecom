from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.ai_chat import AIChatMessage


class AIChatCRUD:

    async def get_history(
        self, db: AsyncSession, user_id: UUID, limit: int = 50
    ) -> list[AIChatMessage]:
        result = await db.execute(
            select(AIChatMessage)
            .where(AIChatMessage.user_id == user_id)
            .order_by(AIChatMessage.created_at.asc())
            .limit(limit)
        )
        return result.scalars().all()

    async def save_message(
        self,
        db: AsyncSession,
        user_id: UUID,
        role: str,
        content: str,
    ) -> AIChatMessage:
        message = AIChatMessage(
            user_id=user_id,
            role=role,
            content=content,
        )
        db.add(message)
        await db.flush()
        return message

    async def clear_history(self, db: AsyncSession, user_id: UUID) -> None:
        from sqlalchemy import delete
        await db.execute(
            delete(AIChatMessage).where(AIChatMessage.user_id == user_id)
        )
        await db.flush()


ai_chat_crud = AIChatCRUD()
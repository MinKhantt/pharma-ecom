from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update
from uuid import UUID
from typing import List

from app.models.message import Message
from app.crud.base import CRUDBase

class MessageCRUD(CRUDBase[Message]):

    async def get_messages(
        self,
        db: AsyncSession,
        conversation_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Message]:
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def mark_messages_read(
        self, db: AsyncSession, conversation_id: UUID, user_id: UUID
    ) -> None:
        await db.execute(
            update(Message)
            .where(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.sender_id != user_id,
                    Message.is_read == False,
                )
            )
            .values(is_read=True)
        )
        await db.flush()

message_crud = MessageCRUD(Message)

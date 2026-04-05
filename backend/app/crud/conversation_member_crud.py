from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from typing import Optional

from app.models.conversation_member import ConversationMember
from app.crud.base import CRUDBase

class ConversationMemberCRUD(CRUDBase[ConversationMember]):

    async def get_member(
        self, db: AsyncSession, conversation_id: UUID, user_id: UUID
    ) -> Optional[ConversationMember]:
        result = await db.execute(
            select(ConversationMember).where(
                and_(
                    ConversationMember.conversation_id == conversation_id,
                    ConversationMember.user_id == user_id,
                )
            )
        )
        return result.scalar_one_or_none()

conversation_member_crud = ConversationMemberCRUD(ConversationMember)

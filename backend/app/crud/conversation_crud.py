from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional, List

from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.user import User
from app.crud.base import CRUDBase


class ConversationCRUD(CRUDBase[Conversation]):
    def _full_query(self):
        return select(Conversation).options(
            selectinload(Conversation.members)
            .joinedload(ConversationMember.user)
            .joinedload(User.profile),
            selectinload(Conversation.messages),
        )

    def _summary_query(self):
        return select(Conversation).options(
            selectinload(Conversation.members)
            .joinedload(ConversationMember.user)
            .joinedload(User.profile)
        )

    async def get_by_id(
        self, db: AsyncSession, conversation_id: UUID
    ) -> Optional[Conversation]:
        result = await db.execute(
            self._full_query().where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def get_user_conversations(
        self, db: AsyncSession, user_id: UUID
    ) -> List[Conversation]:
        result = await db.execute(
            self._summary_query()
            .join(ConversationMember)
            .where(ConversationMember.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
        )
        return result.scalars().all()

    async def get_existing_conversation(
        self, db: AsyncSession, customer_id: UUID, admin_id: UUID
    ) -> Optional[Conversation]:
        result = await db.execute(
            self._full_query()
            .join(ConversationMember)
            .where(ConversationMember.user_id == customer_id)
        )
        conversations = result.scalars().all()
        for conv in conversations:
            member_ids = {m.user_id for m in conv.members}
            if admin_id in member_ids:
                return conv
        return None

    async def touch_conversation(self, db: AsyncSession, conversation_id: UUID) -> None:
        await db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(updated_at=func.now())
        )
        await db.flush()


conversation_crud = ConversationCRUD(Conversation)

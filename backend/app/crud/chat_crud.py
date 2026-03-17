from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.chat import Conversation, ConversationMember, Message


class ChatCRUD:

    def _full_query(self):
        return (
            select(Conversation)
            .options(
                selectinload(Conversation.members),
                selectinload(Conversation.messages),
            )
        )

    def _summary_query(self):
        return (
            select(Conversation)
            .options(selectinload(Conversation.members))
        )

    async def create_conversation(
        self, db: AsyncSession, created_by: UUID
    ) -> Conversation:
        conversation = Conversation(created_by=created_by)
        db.add(conversation)
        await db.flush()
        return conversation

    async def get_by_id(
        self, db: AsyncSession, conversation_id: UUID
    ) -> Optional[Conversation]:
        result = await db.execute(
            self._full_query().where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def get_user_conversations(
        self, db: AsyncSession, user_id: UUID
    ) -> list[Conversation]:
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

    async def add_member(
        self,
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
        role: str = "customer",
    ) -> ConversationMember:
        member = ConversationMember(
            conversation_id=conversation_id,
            user_id=user_id,
            role=role,
        )
        db.add(member)
        await db.flush()
        return member

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

    async def create_message(
        self,
        db: AsyncSession,
        conversation_id: UUID,
        sender_id: UUID,
        content: str,
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
        )
        db.add(message)
        await db.flush()
        return message

    async def get_messages(
        self,
        db: AsyncSession,
        conversation_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Message]:
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

    async def touch_conversation(
        self, db: AsyncSession, conversation_id: UUID
    ) -> None:
        await db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(updated_at=func.now())
        )
        await db.flush()


chat_crud = ChatCRUD()
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from uuid import UUID

from app.crud.chat_crud import chat_crud
from app.models.chat import Conversation, Message
from app.models.user import User
from app.schemas.chat import SendMessageRequest, StartConversationRequest
from app.core.websocket_manager import manager


class ChatService:

    async def _get_any_admin(self, db: AsyncSession) -> User:
        result = await db.execute(
            select(User).where(
                User.is_superuser == True,
                User.is_active == True,
            )
        )
        admin = result.scalars().first()
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No admin available at the moment",
            )
        return admin

    def _message_payload(self, message: Message, event: str = "new_message") -> dict:
        return {
            "event": event,
            "message_id": str(message.id),
            "conversation_id": str(message.conversation_id),
            "sender_id": str(message.sender_id),
            "content": message.content,
            "is_read": message.is_read,
            "created_at": str(message.created_at),
        }

    # ── Customer ──────────────────────────────────────────────────────────────

    async def start_conversation(
        self,
        db: AsyncSession,
        user_id: UUID,
        data: StartConversationRequest,
    ) -> Conversation:
        admin = await self._get_any_admin(db)

        existing = await chat_crud.get_existing_conversation(db, user_id, admin.id)
        if existing:
            message = await chat_crud.create_message(
                db, existing.id, user_id, data.message
            )
            await chat_crud.touch_conversation(db, existing.id)
            await db.commit()

            # Notify admin via WebSocket
            await manager.send_to_admin(
                admin.id, self._message_payload(message)
            )
            return await chat_crud.get_by_id(db, existing.id)

        # New conversation
        conversation = await chat_crud.create_conversation(db, user_id)
        await chat_crud.add_member(db, conversation.id, user_id, role="customer")
        await chat_crud.add_member(db, conversation.id, admin.id, role="admin")
        message = await chat_crud.create_message(
            db, conversation.id, user_id, data.message
        )
        await db.commit()

        # Notify admin
        payload = self._message_payload(message)
        payload["event"] = "new_conversation"
        await manager.send_to_admin(admin.id, payload)

        return await chat_crud.get_by_id(db, conversation.id)

    async def get_my_conversations(
        self, db: AsyncSession, user_id: UUID
    ) -> list[Conversation]:
        return await chat_crud.get_user_conversations(db, user_id)

    async def get_conversation(
        self, db: AsyncSession, user_id: UUID, conversation_id: UUID
    ) -> Conversation:
        conversation = await chat_crud.get_by_id(db, conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        member = await chat_crud.get_member(db, conversation_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this conversation",
            )
        return conversation

    async def send_message(
        self,
        db: AsyncSession,
        user_id: UUID,
        conversation_id: UUID,
        data: SendMessageRequest,
        sender_is_admin: bool = False,
    ) -> Message:
        conversation = await chat_crud.get_by_id(db, conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        member = await chat_crud.get_member(db, conversation_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this conversation",
            )

        message = await chat_crud.create_message(
            db, conversation_id, user_id, data.content
        )
        await chat_crud.touch_conversation(db, conversation_id)
        await db.commit()

        payload = self._message_payload(message)

        if sender_is_admin:
            # Admin sent — push to customer's conversation WebSocket
            await manager.send_to_conversation(conversation_id, payload)
        else:
            # Customer sent — push to all admins
            await manager.broadcast_to_all_admins(payload)

        return message

    async def get_messages(
        self,
        db: AsyncSession,
        user_id: UUID,
        conversation_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> list:
        member = await chat_crud.get_member(db, conversation_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this conversation",
            )
        return await chat_crud.get_messages(db, conversation_id, skip, limit)

    async def mark_read(
        self, db: AsyncSession, user_id: UUID, conversation_id: UUID
    ) -> None:
        member = await chat_crud.get_member(db, conversation_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this conversation",
            )
        await chat_crud.mark_messages_read(db, conversation_id, user_id)
        await db.commit()


chat_service = ChatService()
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from uuid import UUID
from typing import List, Optional

from app.crud.conversation_crud import conversation_crud
from app.crud.conversation_member_crud import conversation_member_crud
from app.crud.message_crud import message_crud
from app.crud.user_crud import user_crud
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.message import Message
from app.schemas.conversation import StartConversationRequest
from app.schemas.message import SendMessageRequest
from app.core.websocket_manager import manager


class ChatService:

    async def get_or_create_conversation(
        self, db: AsyncSession, customer_id: UUID, admin_id: UUID
    ) -> Conversation:
        # Check if conversation already exists between these two
        existing = await conversation_crud.get_existing_conversation(db, customer_id, admin_id)
        if existing:
            return existing

        # Create new conversation
        conversation = await conversation_crud.create(db, obj_in={"created_by": customer_id})

        # Add members
        await conversation_member_crud.create(db, obj_in={
            "conversation_id": conversation.id,
            "user_id": customer_id,
            "role": "customer"
        })
        await conversation_member_crud.create(db, obj_in={
            "conversation_id": conversation.id,
            "user_id": admin_id,
            "role": "admin"
        })

        await db.commit()
        return await conversation_crud.get_by_id(db, conversation.id)

    async def start_conversation(
        self, db: AsyncSession, user_id: UUID, data: StartConversationRequest
    ) -> Conversation:
        # Find an admin to chat with (for now, just the first superuser)
        admin = await user_crud.get_first_admin(db)
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No admin available at the moment"
            )

        conversation = await self.get_or_create_conversation(db, user_id, admin.id)

        # Send initial message
        await self.send_message(db, user_id, conversation.id, SendMessageRequest(content=data.message))

        return conversation

    async def send_message(
        self, db: AsyncSession, sender_id: UUID, conversation_id: UUID, data: SendMessageRequest
    ) -> Message:
        # Verify membership
        member = await conversation_member_crud.get_member(db, conversation_id, sender_id)
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this conversation")

        message = await message_crud.create(db, obj_in={
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "content": data.content
        })

        # Update conversation updated_at
        await conversation_crud.touch_conversation(db, conversation_id)

        await db.commit()
        await db.refresh(message)

        # Broadcast via WebSocket
        await manager.broadcast_to_conversation(
            conversation_id,
            {
                "type": "new_message",
                "data": {
                    "id": str(message.id),
                    "content": message.content,
                    "sender_id": str(message.sender_id),
                    "created_at": message.created_at.isoformat(),
                }
            }
        )

        return message

    async def get_my_conversations(
        self, db: AsyncSession, user_id: UUID
    ) -> List[Conversation]:
        return await conversation_crud.get_user_conversations(db, user_id)

    async def get_conversation(
        self, db: AsyncSession, user_id: UUID, conversation_id: UUID
    ) -> Conversation:
        # Verify membership
        member = await conversation_member_crud.get_member(db, conversation_id, user_id)
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this conversation")

        # Mark messages as read
        await message_crud.mark_messages_read(db, conversation_id, user_id)
        await db.commit()

        return await conversation_crud.get_by_id(db, conversation_id)


chat_service = ChatService()

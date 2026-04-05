from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.db.database import async_session
from app.schemas.conversation import ConversationResponse, ConversationSummaryResponse, StartConversationRequest
from app.schemas.message import MessageResponse, SendMessageRequest
from app.services.chat_service import chat_service
from app.api.v1.dependencies import get_current_user, get_ws_current_user
from app.models.user import User
from app.core.websocket_manager import manager

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ConversationResponse)
async def start_conversation(
    data: StartConversationRequest,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    return await chat_service.start_conversation(db, current_user.id, data)

@router.get("", response_model=List[ConversationSummaryResponse])
async def get_my_conversations(
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    return await chat_service.get_my_conversations(db, current_user.id)

@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    return await chat_service.get_conversation(db, current_user.id, conversation_id)

@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: UUID,
    data: SendMessageRequest,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    return await chat_service.send_message(db, current_user.id, conversation_id, data)


@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: UUID,
    token: str,
):
    # Authenticate manually for WebSocket
    db = await async_session().__anext__()
    user = await get_ws_current_user(token, db)
    
    await manager.connect(websocket, conversation_id, user.id)
    try:
        while True:
            # We mostly broadcast, but can receive pings/ack if needed
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id, user.id)

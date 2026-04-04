from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi import status as http_status
from uuid import UUID

from app.db.database import async_session, get_async_session
from app.schemas.chat import (
    StartConversationRequest,
    SendMessageRequest,
    ConversationResponse,
    ConversationSummaryResponse,
    MessageResponse,
)
from app.services.chat_service import chat_service
from app.api.v1.dependencies import get_current_user, get_current_active_profile, get_current_admin
from app.core.websocket_manager import manager
from app.core.ws_auth import get_ws_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])


# ── WebSocket: Admin connects once after login ────────────────────────────────

@router.websocket("/ws/admin")
async def admin_websocket(websocket: WebSocket):
    """
    Admin connects here after login. Stays open to receive all customer messages.
    Connect: ws://localhost:8000/api/v1/chat/ws/admin?token=<access_token>
    """
    db = await anext(get_async_session())
    try:
        user = await get_ws_user(websocket, db)
        if not user.is_superuser:
            await websocket.close(code=http_status.WS_1008_POLICY_VIOLATION)
            return

        await manager.connect_admin(user.id, websocket)
        await websocket.send_text('{"event": "connected", "role": "admin"}')

        try:
            while True:
                # Keep connection alive — admin sends pings
                data = await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect_admin(user.id)
    finally:
        await db.close()


# ── WebSocket: Customer connects when opening a conversation ──────────────────

@router.websocket("/ws/conversations/{conversation_id}")
async def customer_websocket(websocket: WebSocket, conversation_id: UUID):
    """
    Customer connects here when they open a conversation page.
    Connect: ws://localhost:8000/api/v1/chat/ws/conversations/{id}?token=<access_token>
    """
    db = await anext(get_async_session())
    try:
        user = await get_ws_user(websocket, db)

        # Verify user is a member of this conversation
        from app.crud.chat_crud import conversation_member_crud
        member = await conversation_member_crud.get_member(db, conversation_id, user.id)
        if not member:
            await websocket.close(code=http_status.WS_1008_POLICY_VIOLATION)
            return

        await manager.connect_customer(conversation_id, websocket)
        await websocket.send_text('{"event": "connected", "role": "customer"}')

        try:
            while True:
                # Keep connection alive — customer sends pings
                data = await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect_customer(conversation_id, websocket)
    finally:
        await db.close()


# ── REST: Customer endpoints ──────────────────────────────────────────────────

@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=http_status.HTTP_201_CREATED,
)
async def start_conversation(
    data: StartConversationRequest,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    return await chat_service.start_conversation(db, current_user.id, data)


@router.get("/conversations", response_model=list[ConversationSummaryResponse])
async def get_my_conversations(
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    return await chat_service.get_my_conversations(db, current_user.id)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    return await chat_service.get_conversation(db, current_user.id, conversation_id)


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
async def get_messages(
    conversation_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
):
    return await chat_service.get_messages(
        db, current_user.id, conversation_id, skip, limit
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
)
async def send_message(
    conversation_id: UUID,
    data: SendMessageRequest,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    return await chat_service.send_message(
        db, current_user.id, conversation_id, data, sender_is_admin=False
    )


@router.post(
    "/conversations/{conversation_id}/read",
    status_code=http_status.HTTP_204_NO_CONTENT,
)
async def mark_read(
    conversation_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    await chat_service.mark_read(db, current_user.id, conversation_id)


# ── REST: Admin endpoints ─────────────────────────────────────────────────────

@router.get("/admin/conversations", response_model=list[ConversationSummaryResponse])
async def admin_get_conversations(
    db: async_session,
    current_user: User = Depends(get_current_admin),
):
    return await chat_service.get_my_conversations(db, current_user.id)


@router.get(
    "/admin/conversations/{conversation_id}",
    response_model=ConversationResponse,
)
async def admin_get_conversation(
    conversation_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_admin),
):
    return await chat_service.get_conversation(
        db, current_user.id, conversation_id
    )


@router.post(
    "/admin/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
)
async def admin_reply(
    conversation_id: UUID,
    data: SendMessageRequest,
    db: async_session,
    current_user: User = Depends(get_current_admin),
):
    return await chat_service.send_message(
        db, current_user.id, conversation_id, data, sender_is_admin=True
    )


@router.post(
    "/admin/conversations/{conversation_id}/read",
    status_code=http_status.HTTP_204_NO_CONTENT,
)
async def admin_mark_read(
    conversation_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_admin),
):
    await chat_service.mark_read(db, current_user.id, conversation_id)

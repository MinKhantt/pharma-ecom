from fastapi import APIRouter, Depends
from fastapi import status as http_status

from app.db.database import async_session
from app.schemas.ai_chat import AIChatRequest, AIChatResponse, AIChatMessageResponse
from app.services.ai_chat_service import ai_chat_service
from app.api.v1.dependencies import get_current_active_profile
from app.models.user import User

router = APIRouter(prefix="/ai-chat", tags=["ai-chat"])


@router.post("", response_model=AIChatResponse)
async def chat(
    data: AIChatRequest,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    """Send a message and get AI reply. History is loaded from DB automatically."""
    reply, history = await ai_chat_service.chat(db, current_user.id, data)
    return AIChatResponse(reply=reply, history=history)


@router.get("/history", response_model=list[AIChatMessageResponse])
async def get_history(
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    """Load full chat history for the current user."""
    return await ai_chat_service.get_history(db, current_user.id)


@router.delete("/history", status_code=http_status.HTTP_204_NO_CONTENT)
async def clear_history(
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    """Clear all AI chat history for the current user."""
    await ai_chat_service.clear_history(db, current_user.id)
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from uuid import UUID

from app.core.config import settings
from app.crud.ai_chat_crud import ai_chat_crud
from app.schemas.ai_chat import AIChatRequest

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

SYSTEM_PROMPT = """You are a helpful pharmacy assistant for our online pharmacy shop.
You help customers with:
- Questions about medicines and products we sell
- General medicine usage and dosage information
- Whether a product requires a prescription
- Help navigating the pharmacy shop

Important rules:
- Never give specific medical diagnoses
- Always recommend consulting a doctor or pharmacist for serious medical concerns
- Only answer questions related to pharmacy and medicines
- Be friendly, clear, and concise"""


class AIChatService:

    async def chat(
        self, db: AsyncSession, user_id: UUID, data: AIChatRequest
    ) -> tuple[str, list]:
        # Load existing history from DB
        history = await ai_chat_crud.get_history(db, user_id)

        # Build messages array for LLM
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *[{"role": msg.role, "content": msg.content} for msg in history],
            {"role": "user", "content": data.message},
        ]

        # Call OpenRouter
        try:
            response = await client.chat.completions.create(
                model="stepfun/step-3.5-flash:free",
                messages=messages,
                max_tokens=1024,
            )
            reply = response.choices[0].message.content
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI service unavailable: {str(e)}",
            )

        # Save user message and assistant reply to DB
        await ai_chat_crud.save_message(db, user_id, "user", data.message)
        await ai_chat_crud.save_message(db, user_id, "assistant", reply)
        await db.commit()

        # Return updated history
        updated_history = await ai_chat_crud.get_history(db, user_id)
        return reply, updated_history

    async def get_history(
        self, db: AsyncSession, user_id: UUID
    ) -> list:
        return await ai_chat_crud.get_history(db, user_id)

    async def clear_history(
        self, db: AsyncSession, user_id: UUID
    ) -> None:
        await ai_chat_crud.clear_history(db, user_id)
        await db.commit()


ai_chat_service = AIChatService()
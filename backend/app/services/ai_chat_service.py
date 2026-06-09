from typing import List, Dict, Any
from uuid import UUID
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path

from app.core.config import settings
from app.crud.ai_chat_crud import ai_chat_crud
from app.models.ai_chat import AIChatMessage
from app.utils.pharmacy_search_helper import PharmacySearchHelper


class AIChatService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_URL,
        )
        self.model = settings.OPENROUTER_MODEL
        self.prompt_template = self._load_prompt_template()

    def _load_prompt_template(self) -> str:
        path = (
            Path(__file__).resolve().parents[2]
            / "prompts"
            / "pharmacy_system_prompt.md"
        )
        return path.read_text(encoding="utf-8")

    def _build_system_prompt(self, product_context: str) -> str:
        return self.prompt_template.replace("{{product_context}}", product_context)

    async def chat(
        self,
        db: AsyncSession,
        user_id: UUID,
        message: str,
    ) -> Dict[str, Any]:
        try:
            products = await PharmacySearchHelper.search_products(db, message)
            product_context = PharmacySearchHelper.build_product_context(products)
            system_prompt = self._build_system_prompt(product_context)

            history = await ai_chat_crud.get_history(db, user_id, limit=10)

            messages = [{"role": "system", "content": system_prompt}]
            for msg in history:
                messages.append({"role": msg.role, "content": msg.content})
            messages.append({"role": "user", "content": message})

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1000,
            )
            reply = response.choices[0].message.content

            
            await ai_chat_crud.create(
                db, obj_in={"user_id": user_id, "role": "user", "content": message}
            )
            await ai_chat_crud.create(
                db, obj_in={"user_id": user_id, "role": "assistant", "content": reply}
            )

            await db.commit()

            updated_history = await ai_chat_crud.get_history(db, user_id)
            return {"reply": reply, "history": updated_history}

        except Exception:
            await db.rollback()
            return {
                "reply": "I apologize, but I'm having trouble processing your request right now. Please try again later.",
                "history": await ai_chat_crud.get_history(db, user_id),
            }

    async def get_history(self, db: AsyncSession, user_id: UUID) -> List[AIChatMessage]:
        return await ai_chat_crud.get_history(db, user_id)

    async def clear_history(self, db: AsyncSession, user_id: UUID) -> None:
        await ai_chat_crud.clear_history(db, user_id)
        await db.commit()


ai_chat_service = AIChatService()

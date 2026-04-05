import re
from typing import List, Dict, Any
from uuid import UUID
from openai import AsyncOpenAI
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud.ai_chat_crud import ai_chat_crud
from app.models.ai_chat import AIChatMessage
from app.models.product import Product


class PharmacySearchHelper:
    """Helper class to handle product search and context building for AI."""

    STOP_WORDS = {
        "do", "you", "have", "i", "want", "need", "can", "get", "is", "are",
        "the", "a", "an", "for", "to", "in", "of", "and", "or", "what",
        "how", "much", "price", "stock", "available", "sell", "selling",
        "buy", "looking", "find", "me", "my", "any", "some", "this", "that",
        "please", "hi", "hello", "thanks", "thank", "yes", "no", "mg", "ml",
        "tablet", "tablets", "capsule", "capsules", "syrup", "cream", "gel",
    }

    @classmethod
    def extract_keywords(cls, message: str) -> List[str]:
        """Extract meaningful keywords from user message for product search."""
        words = re.findall(r"[a-zA-Z]+", message.lower())
        return [w for w in words if len(w) >= 3 and w not in cls.STOP_WORDS]

    @staticmethod
    async def search_products(db: AsyncSession, message: str) -> List[Product]:
        """Search products by name, manufacturer, or description based on keywords."""
        keywords = PharmacySearchHelper.extract_keywords(message)
        if not keywords:
            return []

        # Build OR conditions across name, manufacturer, description
        conditions = []
        for kw in keywords:
            pattern = f"%{kw}%"
            conditions.extend([
                Product.name.ilike(pattern),
                Product.manufacturer.ilike(pattern),
                Product.description.ilike(pattern)
            ])

        result = await db.execute(
            select(Product)
            .where(or_(*conditions))
            .where(Product.inventory > 0)
            .limit(5)
        )
        return list(result.scalars().all())

    @staticmethod
    def build_product_context(products: List[Product]) -> str:
        """Format found products into a readable context string for the AI."""
        if not products:
            return "No specific products found in the database matching this query."

        lines = ["REAL-TIME INVENTORY DATA:"]
        for p in products:
            status = "In Stock" if p.inventory > 0 else "Out of Stock"
            rx = "Prescription required" if p.requires_prescription else "Over-the-counter"
            lines.append(
                f"- {p.name} | Price: {p.price} MMK | Stock: {p.inventory} ({status}) | {rx}"
                + (f" | Manufacturer: {p.manufacturer}" if p.manufacturer else "")
            )
        return "\n".join(lines)


class AIChatService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1",
        )
        self.model = settings.OPENROUTER_MODEL

    def _build_system_prompt(self, product_context: str) -> str:
        """Build the AI system prompt with injected context."""
        return f"""You are a helpful pharmacy assistant for Shwe La Min Pharmacy in Myanmar.

Your responsibilities:
- Answer questions about medicines, dosages, side effects, and drug interactions.
- Help customers find products available in our pharmacy using provided data.
- Pricing is in Myanmar Kyat (MMK).
- Always recommend consulting a doctor for serious medical conditions.
- Never diagnose medical conditions.
- Respond in the same language as the customer (English or Myanmar).

---
{product_context}
---

If a product is listed in the inventory data, confirm availability and give details. 
If not found, politely inform the customer and suggest contacting the pharmacy directly."""

    async def chat(
        self,
        db: AsyncSession,
        user_id: UUID,
        message: str,
    ) -> Dict[str, Any]:
        try:
            # 1. Product Search & Context
            products = await PharmacySearchHelper.search_products(db, message)
            product_context = PharmacySearchHelper.build_product_context(products)
            system_prompt = self._build_system_prompt(product_context)

            # 2. Conversation History (Last 10 messages for AI context)
            history = await ai_chat_crud.get_history(db, user_id, limit=10)

            # 3. Prepare AI Messages
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history:
                messages.append({"role": msg.role, "content": msg.content})
            messages.append({"role": "user", "content": message})

            # 4. Get AI Response
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1000,
            )
            reply = response.choices[0].message.content

            # 5. Save Conversation
            # User message
            await ai_chat_crud.create(db, obj_in={
                "user_id": user_id, 
                "role": "user", 
                "content": message
            })
            # AI message
            await ai_chat_crud.create(db, obj_in={
                "user_id": user_id, 
                "role": "assistant", 
                "content": reply
            })
            
            await db.commit()

            # 6. Return response and fresh history
            updated_history = await ai_chat_crud.get_history(db, user_id)
            return {"reply": reply, "history": updated_history}

        except Exception as e:
            await db.rollback()
            return {
                "reply": "I apologize, but I'm having trouble processing your request right now. Please try again later.",
                "history": await ai_chat_crud.get_history(db, user_id)
            }

    async def get_history(self, db: AsyncSession, user_id: UUID) -> List[AIChatMessage]:
        return await ai_chat_crud.get_history(db, user_id)

    async def clear_history(self, db: AsyncSession, user_id: UUID) -> None:
        await ai_chat_crud.clear_history(db, user_id)
        await db.commit()


ai_chat_service = AIChatService()

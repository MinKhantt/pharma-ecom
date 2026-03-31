from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from uuid import UUID
import re

from app.core.config import settings
from app.crud.ai_chat_crud import ai_chat_crud
from app.models.ai_chat import AIChatMessage
from app.models.product import Product, Category

client = AsyncOpenAI(
    api_key=settings.OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)


# ── Keyword extraction ────────────────────────────────────────────────────────

def extract_keywords(message: str) -> list[str]:
    """
    Extract meaningful keywords from user message for product search.
    Removes common stop words and short words.
    """
    stop_words = {
        "do", "you", "have", "i", "want", "need", "can", "get", "is", "are",
        "the", "a", "an", "for", "to", "in", "of", "and", "or", "what",
        "how", "much", "price", "stock", "available", "sell", "selling",
        "buy", "looking", "find", "me", "my", "any", "some", "this", "that",
        "please", "hi", "hello", "thanks", "thank", "yes", "no", "mg", "ml",
        "tablet", "tablets", "capsule", "capsules", "syrup", "cream", "gel",
    }
    # Tokenise — keep words 3+ characters, not stop words
    words = re.findall(r"[a-zA-Z]+", message.lower())
    return [w for w in words if len(w) >= 3 and w not in stop_words]


# ── Product search ────────────────────────────────────────────────────────────

async def search_products(db: AsyncSession, message: str) -> list[Product]:
    """
    Search products by name, manufacturer, description, or category
    using keywords extracted from the user's message.
    Returns up to 5 most relevant products.
    """
    keywords = extract_keywords(message)
    if not keywords:
        return []

    # Build OR conditions across name, manufacturer, description
    conditions = []
    for kw in keywords:
        pattern = f"%{kw}%"
        conditions.append(Product.name.ilike(pattern))
        conditions.append(Product.manufacturer.ilike(pattern))
        conditions.append(Product.description.ilike(pattern))

    result = await db.execute(
        select(Product)
        .where(or_(*conditions))
        .where(Product.inventory > 0)
        .limit(5)
    )
    return result.scalars().all()


async def search_categories(db: AsyncSession, message: str) -> list[str]:
    """
    Search category names relevant to the message.
    E.g. 'pain' matches 'Pain Relief'.
    """
    keywords = extract_keywords(message)
    if not keywords:
        return []

    conditions = [Category.name.ilike(f"%{kw}%") for kw in keywords]
    result = await db.execute(
        select(Category).where(or_(*conditions))
    )
    categories = result.scalars().all()
    return [c.name for c in categories]


# ── Context builder ───────────────────────────────────────────────────────────

def build_product_context(products: list[Product]) -> str:
    """
    Format found products into a readable context string for the AI.
    """
    if not products:
        return ""

    lines = ["PRODUCTS AVAILABLE IN OUR DATABASE:"]
    for p in products:
        status = "In Stock" if p.inventory > 0 else "Out of Stock"
        rx = "Prescription required" if p.requires_prescription else "Over-the-counter"
        lines.append(
            f"- {p.name}"
            f" | Price: {p.price} MMK"
            f" | Stock: {p.inventory} units ({status})"
            f" | {rx}"
            + (f" | Manufacturer: {p.manufacturer}" if p.manufacturer else "")
            + (f" | Info: {p.description[:120]}..." if p.description else "")
        )
    return "\n".join(lines)


def build_system_prompt(product_context: str) -> str:
    """
    Build the AI system prompt, injecting real product data if available.
    """
    base = """You are a helpful pharmacy assistant for Shwe La Min Pharmacy in Myanmar.

Your responsibilities:
- Answer questions about medicines, dosages, side effects, and drug interactions
- Help customers find products available in our pharmacy
- Provide general health advice
- Guide customers on prescription requirements
- Always recommend consulting a doctor for serious medical conditions
- Never diagnose medical conditions
- Be friendly, concise, and professional
- Respond in the same language the customer uses (English or Myanmar)

Pricing is in Myanmar Kyat (MMK)."""

    if product_context:
        base += f"""

---
REAL-TIME INVENTORY DATA (use this to answer product availability questions):
{product_context}

When answering about products:
- Use ONLY the data above — do not guess or invent products we do not carry
- If a product is listed, confirm we have it, give the price and stock status
- If no matching product is found in the data above, say we don't currently carry it and suggest alternatives if appropriate
- Mention prescription requirements when relevant
---"""
    else:
        base += """

Note: No specific products matched the customer's query in our database.
If they ask about a specific medicine we don't carry, let them know politely
and suggest they contact us directly or visit in person."""

    return base


# ── Main service ──────────────────────────────────────────────────────────────

class AIChatService:

    async def chat(
        self,
        db: AsyncSession,
        user_id: UUID,
        message: str,
    ) -> dict:
        # 1. Search products relevant to the message
        products = await search_products(db, message)
        product_context = build_product_context(products)
        system_prompt = build_system_prompt(product_context)

        # 2. Load conversation history
        history = await ai_chat_crud.get_history(db, user_id)

        # 3. Build messages for the AI
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history[-10:]:  # last 10 messages for context window
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": message})

        # 4. Call the AI
        response = await client.chat.completions.create(
            model="stepfun/step-3.5-flash:free",
            messages=messages,
            max_tokens=1000,
        )
        reply = response.choices[0].message.content

        # 5. Save both messages to DB
        await ai_chat_crud.save_message(db, user_id, "user", message)
        await ai_chat_crud.save_message(db, user_id, "assistant", reply)
        await db.commit()

        # 6. Return reply + updated history
        updated_history = await ai_chat_crud.get_history(db, user_id)
        return {"reply": reply, "history": updated_history}  # ← must be a dict

    async def get_history(
        self, db: AsyncSession, user_id: UUID
    ) -> list[AIChatMessage]:
        return await ai_chat_crud.get_history(db, user_id)

    async def clear_history(
        self, db: AsyncSession, user_id: UUID
    ) -> None:
        await ai_chat_crud.clear_history(db, user_id)
        await db.commit()


ai_chat_service = AIChatService()
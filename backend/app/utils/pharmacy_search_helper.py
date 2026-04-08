import re
from typing import List
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product


class PharmacySearchHelper:
    """Helper class to handle product search and context building for AI."""

    STOP_WORDS = {
        "do",
        "you",
        "have",
        "i",
        "want",
        "need",
        "can",
        "get",
        "is",
        "are",
        "the",
        "a",
        "an",
        "for",
        "to",
        "in",
        "of",
        "and",
        "or",
        "what",
        "how",
        "much",
        "price",
        "stock",
        "available",
        "sell",
        "selling",
        "buy",
        "looking",
        "find",
        "me",
        "my",
        "any",
        "some",
        "this",
        "that",
        "please",
        "hi",
        "hello",
        "thanks",
        "thank",
        "yes",
        "no",
        "mg",
        "ml",
        "tablet",
        "tablets",
        "capsule",
        "capsules",
        "syrup",
        "cream",
        "gel",
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
            conditions.extend(
                [
                    Product.name.ilike(pattern),
                    Product.manufacturer.ilike(pattern),
                    Product.description.ilike(pattern),
                ]
            )

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
            rx = (
                "Prescription required"
                if p.requires_prescription
                else "Over-the-counter"
            )
            lines.append(
                f"- {p.name} | Price: {p.price} MMK | Stock: {p.inventory} ({status}) | {rx}"
                + (f" | Manufacturer: {p.manufacturer}" if p.manufacturer else "")
            )
        return "\n".join(lines)

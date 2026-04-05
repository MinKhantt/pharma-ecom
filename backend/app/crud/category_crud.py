from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional, List

from app.models.category import Category
from app.crud.base import CRUDBase

class CategoryCRUD(CRUDBase[Category]):

    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Category]:
        result = await db.execute(
            select(Category).where(Category.name == name)
        )
        return result.scalar_one_or_none()

    async def get_all_ordered(self, db: AsyncSession) -> List[Category]:
        result = await db.execute(select(Category).order_by(Category.name))
        return result.scalars().all()

category_crud = CategoryCRUD(Category)

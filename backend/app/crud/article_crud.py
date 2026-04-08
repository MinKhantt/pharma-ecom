from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from uuid import UUID
from typing import Optional, List, Tuple
from app.models.article import Article
from app.crud.base import CRUDBase


class ArticleCRUD(CRUDBase[Article]):
    def _base_query(self):
        return select(Article).options(joinedload(Article.author))

    async def get_by_id(self, db: AsyncSession, article_id: UUID) -> Optional[Article]:
        result = await db.execute(self._base_query().where(Article.id == article_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Optional[Article]:
        result = await db.execute(self._base_query().where(Article.slug == slug))
        return result.scalar_one_or_none()

    async def get_all_paginated(
        self,
        db: AsyncSession,
        published_only: bool = True,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
    ) -> Tuple[List[Article], int]:
        query = self._base_query()
        count_query = select(func.count()).select_from(Article)

        if published_only:
            query = query.where(Article.is_published)
            count_query = count_query.where(Article.is_published)

        if category:
            query = query.where(Article.category == category)
            count_query = count_query.where(Article.category == category)

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(Article.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all(), total


article_crud = ArticleCRUD(Article)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from uuid import UUID
from typing import Optional
from app.models.article import Article
from app.models.user import User


class ArticleCRUD:

    def _base_query(self):
        return (
            select(Article)
            .options(joinedload(Article.author))
        )

    async def create(self, db: AsyncSession, data: dict) -> Article:
        article = Article(**data)
        db.add(article)
        await db.flush()
        return article

    async def get_by_id(self, db: AsyncSession, article_id: UUID) -> Optional[Article]:
        result = await db.execute(
            self._base_query().where(Article.id == article_id)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Optional[Article]:
        result = await db.execute(
            self._base_query().where(Article.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        db: AsyncSession,
        published_only: bool = True,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
    ) -> tuple[list[Article], int]:
        query = self._base_query()
        count_query = select(func.count()).select_from(Article)

        if published_only:
            query = query.where(Article.is_published == True)
            count_query = count_query.where(Article.is_published == True)

        if category:
            query = query.where(Article.category == category)
            count_query = count_query.where(Article.category == category)

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(Article.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all(), total

    async def update(self, db: AsyncSession, article: Article, data: dict) -> Article:
        for k, v in data.items():
            setattr(article, k, v)
        await db.flush()
        return article

    async def delete(self, db: AsyncSession, article: Article) -> None:
        await db.delete(article)
        await db.flush()


article_crud = ArticleCRUD()
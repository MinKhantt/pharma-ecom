from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, UploadFile
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional
import re

from app.crud.article_crud import article_crud
from app.models.article import Article
from app.schemas.article import ArticleCreate, ArticleUpdate
from app.core.file_upload import save_upload_file


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


async def unique_slug(db: AsyncSession, title: str) -> str:
    base = slugify(title)
    slug = base
    counter = 1
    while await article_crud.get_by_slug(db, slug):
        slug = f"{base}-{counter}"
        counter += 1
    return slug


class ArticleService:
    async def create(
        self,
        db: AsyncSession,
        author_id: UUID,
        data: ArticleCreate,
    ) -> Article:
        slug = await unique_slug(db, data.title)
        published_at = datetime.now(timezone.utc) if data.is_published else None

        article = await article_crud.create(
            db,
            obj_in={
                "title": data.title,
                "slug": slug,
                "content": data.content,
                "excerpt": data.excerpt,
                "category": data.category,
                "is_published": data.is_published,
                "published_at": published_at,
                "author_id": author_id,
            },
        )
        await db.commit()
        return await article_crud.get_by_id(db, article.id)

    async def upload_cover(
        self,
        db: AsyncSession,
        article_id: UUID,
        file: UploadFile,
    ) -> Article:
        article = await article_crud.get_by_id(db, article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        _, _, url = await save_upload_file(file)
        await article_crud.update(db, db_obj=article, obj_in={"cover_image_url": url})
        await db.commit()
        return await article_crud.get_by_id(db, article_id)

    async def get_public(
        self,
        db: AsyncSession,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
    ) -> tuple[list[Article], int]:
        return await article_crud.get_all_paginated(
            db, published_only=True, category=category, skip=skip, limit=limit
        )

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Article:
        article = await article_crud.get_by_slug(db, slug)
        if not article or not article.is_published:
            raise HTTPException(status_code=404, detail="Article not found")
        return article

    async def get_all_admin(
        self,
        db: AsyncSession,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Article], int]:
        return await article_crud.get_all_paginated(
            db, published_only=False, category=category, skip=skip, limit=limit
        )

    async def update(
        self,
        db: AsyncSession,
        article_id: UUID,
        data: ArticleUpdate,
    ) -> Article:
        article = await article_crud.get_by_id(db, article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        update_data = data.model_dump(exclude_none=True)

        if "is_published" in update_data:
            if update_data["is_published"] and not article.published_at:
                update_data["published_at"] = datetime.now(timezone.utc)
            elif not update_data["is_published"]:
                update_data["published_at"] = None

        await article_crud.update(db, db_obj=article, obj_in=update_data)
        await db.commit()
        return await article_crud.get_by_id(db, article_id)

    async def delete(self, db: AsyncSession, article_id: UUID) -> None:
        article = await article_crud.get_by_id(db, article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        await article_crud.delete(db, db_obj=article)
        await db.commit()


article_service = ArticleService()

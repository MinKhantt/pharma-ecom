from fastapi import APIRouter, Depends, Query, UploadFile, File
from fastapi import status as http_status
from uuid import UUID
from typing import Optional

from app.db.database import async_session
from app.schemas.article import (
    ArticleCreate,
    ArticleUpdate,
    ArticleResponse,
    ArticleListResponse,
)
from app.services.article_service import article_service
from app.api.v1.dependencies import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/articles", tags=["articles"])


# ── Public ────────────────────────────────────────────────────────────────────


@router.get("", response_model=ArticleListResponse)
async def get_articles(
    db: async_session,
    category: Optional[str] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=50),
):
    articles, total = await article_service.get_public(
        db, category=category, skip=skip, limit=limit
    )
    return ArticleListResponse(items=articles, total=total, skip=skip, limit=limit)


@router.get("/{slug}", response_model=ArticleResponse)
async def get_article(slug: str, db: async_session):
    return await article_service.get_by_slug(db, slug)


# ── Admin ─────────────────────────────────────────────────────────────────────


@router.get("/admin/all", response_model=ArticleListResponse)
async def admin_get_articles(
    db: async_session,
    category: Optional[str] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
):
    articles, total = await article_service.get_all_admin(
        db, category=category, skip=skip, limit=limit
    )
    return ArticleListResponse(items=articles, total=total, skip=skip, limit=limit)


@router.post(
    "", response_model=ArticleResponse, status_code=http_status.HTTP_201_CREATED
)
async def create_article(
    data: ArticleCreate,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    return await article_service.create(db, admin.id, data)


@router.post("/{article_id}/cover", response_model=ArticleResponse)
async def upload_cover(
    article_id: UUID,
    db: async_session,
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin),
):
    return await article_service.upload_cover(db, article_id, file)


@router.patch("/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: UUID,
    data: ArticleUpdate,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    return await article_service.update(db, article_id, data)


@router.delete("/{article_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: UUID,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    await article_service.delete(db, article_id)

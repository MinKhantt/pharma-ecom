from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from uuid import UUID

from app.db.database import async_session
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewListResponse
from app.services.review_service import review_service
from app.api.v1.dependencies import get_current_user, get_current_active_profile, get_current_admin
from app.models.user import User

router = APIRouter(prefix="/reviews", tags=["reviews"])


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("", response_model=ReviewListResponse)
async def get_public_reviews(
    db: async_session,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
):
    reviews, total = await review_service.get_public_reviews(db, skip=skip, limit=limit)
    return ReviewListResponse(items=reviews, total=total)


# ── Customer ──────────────────────────────────────────────────────────────────

@router.post("", response_model=ReviewResponse, status_code=http_status.HTTP_201_CREATED)
async def create_review(
    data: ReviewCreate,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    return await review_service.create_review(db, current_user.id, data)


@router.get("/me", response_model=ReviewResponse | None)
async def get_my_review(
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    return await review_service.get_my_review(db, current_user.id)


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.get("/admin", response_model=ReviewListResponse)
async def get_all_reviews(
    db: async_session,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
):
    reviews, total = await review_service.get_all_reviews(db, skip=skip, limit=limit)
    return ReviewListResponse(items=reviews, total=total)


@router.patch("/{review_id}/approve", response_model=ReviewResponse)
async def approve_review(
    review_id: UUID,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    return await review_service.approve_review(db, review_id)


@router.delete("/{review_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: UUID,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    await review_service.delete_review(db, review_id)
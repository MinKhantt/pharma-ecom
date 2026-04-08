from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from uuid import UUID

from app.crud.review_crud import review_crud
from app.models.review import ShopReview
from app.models.order import Order, OrderStatus
from app.schemas.review import ReviewCreate


class ReviewService:
    async def _has_delivered_order(self, db: AsyncSession, user_id: UUID) -> bool:
        result = await db.execute(
            select(func.count())
            .select_from(Order)
            .where(Order.user_id == user_id)
            .where(Order.status == OrderStatus.DELIVERED)
        )
        return (result.scalar() or 0) > 0

    async def create_review(
        self, db: AsyncSession, user_id: UUID, data: ReviewCreate
    ) -> ShopReview:
        # Must have at least one delivered order
        if not await self._has_delivered_order(db, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only leave a review after receiving a delivered order",
            )

        # One review per user
        existing = await review_crud.get_by_user_id(db, user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already submitted a review",
            )

        review = await review_crud.create(
            db,
            obj_in={
                "user_id": user_id,
                "rating": data.rating,
                "comment": data.comment,
                "is_approved": False,
            },
        )
        await db.commit()
        return await review_crud.get_by_id(db, review.id)

    async def get_my_review(self, db: AsyncSession, user_id: UUID) -> ShopReview | None:
        return await review_crud.get_by_user_id(db, user_id)

    async def get_public_reviews(
        self, db: AsyncSession, skip: int = 0, limit: int = 20
    ) -> tuple[list[ShopReview], int]:
        return await review_crud.get_all_paginated(
            db, approved_only=True, skip=skip, limit=limit
        )

    # ── Admin ────────────────────────────────────────────────────────────────

    async def get_all_reviews(
        self, db: AsyncSession, skip: int = 0, limit: int = 20
    ) -> tuple[list[ShopReview], int]:
        return await review_crud.get_all_paginated(
            db, approved_only=False, skip=skip, limit=limit
        )

    async def approve_review(self, db: AsyncSession, review_id: UUID) -> ShopReview:
        review = await review_crud.get_by_id(db, review_id)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        await review_crud.update(db, db_obj=review, obj_in={"is_approved": True})
        await db.commit()
        return await review_crud.get_by_id(db, review_id)

    async def delete_review(self, db: AsyncSession, review_id: UUID) -> None:
        review = await review_crud.get_by_id(db, review_id)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        await review_crud.delete(db, db_obj=review)
        await db.commit()


review_service = ReviewService()

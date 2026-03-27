from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from uuid import UUID
from typing import Optional
from app.models.review import ShopReview
from app.models.user import User
from app.models.customer import CustomerProfile


class ReviewCRUD:

    def _base_query(self):
        return (
            select(ShopReview)
            .join(ShopReview.user)
            .options(
                joinedload(ShopReview.user).joinedload(User.profile)
            )
        )

    async def create(self, db: AsyncSession, data: dict) -> ShopReview:
        review = ShopReview(**data)
        db.add(review)
        await db.flush()
        return review

    async def get_by_id(
        self, db: AsyncSession, review_id: UUID
    ) -> Optional[ShopReview]:
        result = await db.execute(
            self._base_query().where(ShopReview.id == review_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(
        self, db: AsyncSession, user_id: UUID
    ) -> Optional[ShopReview]:
        result = await db.execute(
            self._base_query().where(ShopReview.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        db: AsyncSession,
        approved_only: bool = True,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[ShopReview], int]:
        query = self._base_query()
        count_query = select(func.count()).select_from(ShopReview)

        if approved_only:
            query = query.where(ShopReview.is_approved == True)
            count_query = count_query.where(ShopReview.is_approved == True)

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(ShopReview.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all(), total

    async def update(
        self, db: AsyncSession, review: ShopReview, data: dict
    ) -> ShopReview:
        for k, v in data.items():
            setattr(review, k, v)
        await db.flush()
        return review

    async def delete(self, db: AsyncSession, review: ShopReview) -> None:
        await db.delete(review)
        await db.flush()


review_crud = ReviewCRUD()
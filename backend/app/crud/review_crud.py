from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from uuid import UUID
from typing import Optional, List, Tuple
from app.models.review import ShopReview
from app.models.user import User
from app.crud.base import CRUDBase


class ReviewCRUD(CRUDBase[ShopReview]):
    def _base_query(self):
        return select(ShopReview).options(
            joinedload(ShopReview.user).joinedload(User.profile)
        )

    async def get_by_id(
        self, db: AsyncSession, review_id: UUID
    ) -> Optional[ShopReview]:
        result = await db.execute(self._base_query().where(ShopReview.id == review_id))
        return result.scalar_one_or_none()

    async def get_by_user_id(
        self, db: AsyncSession, user_id: UUID
    ) -> Optional[ShopReview]:
        result = await db.execute(
            self._base_query().where(ShopReview.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_all_paginated(
        self,
        db: AsyncSession,
        approved_only: bool = True,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[ShopReview], int]:
        query = self._base_query()
        count_query = select(func.count()).select_from(ShopReview)

        if approved_only:
            query = query.where(ShopReview.is_approved)
            count_query = count_query.where(ShopReview.is_approved)

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(ShopReview.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all(), total


review_crud = ReviewCRUD(ShopReview)

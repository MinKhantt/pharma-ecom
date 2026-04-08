from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional, List

from app.models.user import User
from app.models.customer import CustomerProfile
from app.crud.base import CRUDBase


class UserCRUD(CRUDBase[User]):
    def _base_query(self):
        return select(User).options(selectinload(User.profile))

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get_by_id(self, db: AsyncSession, user_id: UUID) -> Optional[User]:
        result = await db.execute(self._base_query().where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(self._base_query().where(User.email == email))
        return result.scalar_one_or_none()

    async def get_all_paginated(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
    ) -> List[User]:
        result = await db.execute(
            self._base_query()
            .offset(skip)
            .limit(limit)
            .order_by(User.created_at.desc())
        )
        return result.scalars().all()

    # ── Profile ───────────────────────────────────────────────────────────────

    async def update_profile(
        self,
        db: AsyncSession,
        user_id: UUID,
        data: dict,
    ) -> Optional[CustomerProfile]:
        result = await db.execute(
            select(CustomerProfile).where(CustomerProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return None
        for field, value in data.items():
            setattr(profile, field, value)
        await db.flush()
        return profile

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def exists_by_email(self, db: AsyncSession, email: str) -> bool:
        result = await db.execute(select(User.id).where(User.email == email))
        return result.scalar_one_or_none() is not None


user_crud = UserCRUD(User)

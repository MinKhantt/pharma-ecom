from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.user import User
from app.models.customer import CustomerProfile


class UserCRUD:

    # ── Create ────────────────────────────────────────────────────────────────

    async def create(self, db: AsyncSession, user: User) -> User:
        db.add(user)
        await db.flush()
        return user

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get_by_id(self, db: AsyncSession, user_id: UUID) -> Optional[User]:
        result = await db.execute(
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.profile))
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(
            select(User)
            .where(User.email == email)
            .options(selectinload(User.profile))
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
    ) -> list[User]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.profile))
            .offset(skip)
            .limit(limit)
            .order_by(User.created_at.desc())
        )
        return result.scalars().all()

    # ── Update ────────────────────────────────────────────────────────────────

    async def update(
        self,
        db: AsyncSession,
        user: User,
        data: dict,
    ) -> User:
        for field, value in data.items():
            setattr(user, field, value)
        await db.flush()
        return user

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

    # ── Delete ────────────────────────────────────────────────────────────────

    async def delete(self, db: AsyncSession, user: User) -> None:
        await db.delete(user)
        await db.flush()

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def exists_by_email(self, db: AsyncSession, email: str) -> bool:
        result = await db.execute(
            select(User.id).where(User.email == email)
        )
        return result.scalar_one_or_none() is not None

    async def set_active(
        self, db: AsyncSession, user: User, is_active: bool
    ) -> User:
        user.is_active = is_active
        await db.flush()
        return user


user_crud = UserCRUD()
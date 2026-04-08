import secrets
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from uuid import UUID

from app.models.user import User
from app.models.cart import Cart
from app.models.customer import CustomerProfile
from app.schemas.user import (
    ChangePasswordRequest,
    UserRegisterRequest,
    CompleteProfileRequest,
    UpdateUserRequest,
)
from app.core.security import hash_password, verify_password
from app.crud.user_crud import user_crud


class UserService:
    # ── Register ──────────────────────────────────────────────────────────────

    async def register(self, db: AsyncSession, data: UserRegisterRequest) -> User:
        if await user_crud.exists_by_email(db, data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user = await user_crud.create(
            db,
            obj_in={
                "full_name": data.full_name,
                "email": data.email,
                "hashed_password": hash_password(data.password),
            },
        )

        cart = Cart(user_id=user.id, total_amount=0)
        db.add(cart)

        await db.commit()

        # Re-fetch with profile eagerly loaded
        return await user_crud.get_by_id(db, user.id)

    # ── Complete profile ──────────────────────────────────────────────────────

    async def complete_profile(
        self, db: AsyncSession, user_id: UUID, data: CompleteProfileRequest
    ) -> User:
        user = await user_crud.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if user.profile:
            await user_crud.update_profile(
                db, user_id, data.model_dump(exclude_none=True)
            )
        else:
            profile = CustomerProfile(user_id=user_id, **data.model_dump())
            db.add(profile)

        await user_crud.update(db, db_obj=user, obj_in={"is_profile_complete": True})
        await db.commit()

        # Re-fetch with profile eagerly loaded
        return await user_crud.get_by_id(db, user_id)

    # ── Get current user ──────────────────────────────────────────────────────

    async def get_me(self, db: AsyncSession, user_id: UUID) -> User:
        user = await user_crud.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

    # ── Update user (self) ────────────────────────────────────────────────────

    async def update_me(
        self, db: AsyncSession, user_id: UUID, data: UpdateUserRequest
    ) -> User:
        user = await user_crud.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Split fields — some go to User, some go to CustomerProfile
        user_fields = {}
        profile_fields = {}

        if data.full_name is not None:
            user_fields["full_name"] = data.full_name
        if data.phone_number is not None:
            profile_fields["phone_number"] = data.phone_number
        if data.date_of_birth is not None:
            profile_fields["date_of_birth"] = data.date_of_birth
        if data.avatar_url is not None:
            profile_fields["avatar_url"] = data.avatar_url
        if data.address is not None:
            profile_fields["address"] = data.address

        if user_fields:
            await user_crud.update(db, db_obj=user, obj_in=user_fields)
        if profile_fields:
            await user_crud.update_profile(db, user_id, profile_fields)

        await db.commit()
        return await user_crud.get_by_id(db, user_id)

    # ── Admin: get all users ──────────────────────────────────────────────────

    async def get_all_users(
        self, db: AsyncSession, skip: int = 0, limit: int = 20
    ) -> list[User]:
        return await user_crud.get_all_paginated(db, skip=skip, limit=limit)

    # ── Admin: get user by id ─────────────────────────────────────────────────

    async def get_user_by_id(self, db: AsyncSession, user_id: UUID) -> User:
        user = await user_crud.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

    # ── Admin: delete user ────────────────────────────────────────────────────

    async def delete_user(self, db: AsyncSession, user_id: UUID) -> None:
        user = await user_crud.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        await user_crud.delete(db, db_obj=user)
        await db.commit()

    # ── Admin: update user by id ───────────────────────────────────────────────

    async def update_user_by_id(
        self, db: AsyncSession, user_id: UUID, data: UpdateUserRequest
    ) -> User:
        user = await user_crud.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        user_fields = {}
        profile_fields = {}

        if data.full_name is not None:
            user_fields["full_name"] = data.full_name
        if data.phone_number is not None:
            profile_fields["phone_number"] = data.phone_number
        if data.date_of_birth is not None:
            profile_fields["date_of_birth"] = data.date_of_birth
        if data.avatar_url is not None:
            profile_fields["avatar_url"] = data.avatar_url
        if data.address is not None:
            profile_fields["address"] = data.address

        if user_fields:
            await user_crud.update(db, db_obj=user, obj_in=user_fields)
        if profile_fields:
            await user_crud.update_profile(db, user_id, profile_fields)

        await db.commit()
        return await user_crud.get_by_id(db, user_id)

    async def google_login(
        self, db: AsyncSession, email: str, full_name: str, avatar_url: Optional[str]
    ) -> User:
        user = await user_crud.get_by_email(db, email)

        if not user:
            # Auto-register new user from Google
            user = await user_crud.create(
                db,
                obj_in={
                    "full_name": full_name,
                    "email": email,
                    "hashed_password": hash_password(
                        secrets.token_urlsafe(32)
                    ),  # random unusable password
                    "is_active": True,
                    "is_profile_complete": False,
                },
            )

            # Auto-create cart
            from app.models.cart import Cart

            cart = Cart(user_id=user.id, total_amount=0)
            db.add(cart)

            # Pre-create profile with avatar from Google — user fills the rest
            from app.models.customer import CustomerProfile

            profile = CustomerProfile(user_id=user.id, avatar_url=avatar_url)
            db.add(profile)

            await db.commit()

        # Re-fetch with profile eagerly loaded
        return await user_crud.get_by_id(db, user.id)

    async def change_password(
        self, db: AsyncSession, user_id: UUID, data: ChangePasswordRequest
    ) -> None:
        user = await user_crud.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if not verify_password(data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        if data.current_password == data.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password",
            )

        await user_crud.update(
            db,
            db_obj=user,
            obj_in={"hashed_password": hash_password(data.new_password)},
        )
        await db.commit()


user_service = UserService()

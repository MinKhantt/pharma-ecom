from fastapi import APIRouter, HTTPException, UploadFile, status, Depends, Query, File
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import async_session
from app.schemas.user import (
    ChangePasswordRequest,
    CompleteProfileRequest,
    UpdateUserRequest,
    UserWithProfileResponse,
)
from app.services.user_service import user_service
from app.api.v1.dependencies import get_current_user, get_current_active_profile, get_current_admin
from app.models.user import User
from app.core.file_upload import save_upload_file

router = APIRouter(prefix="/users", tags=["users"])


# ── Complete profile ──────────────────────────────────────────────────────────

@router.post("/me/profile", status_code=status.HTTP_200_OK)
async def complete_profile(
    data: CompleteProfileRequest,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    user = await user_service.complete_profile(db, current_user.id, data)
    return UserWithProfileResponse.model_validate(user)


# ── Get current user ──────────────────────────────────────────────────────────

@router.get("/me", response_model=UserWithProfileResponse)
async def get_me(
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    user = await user_service.get_me(db, current_user.id)
    return UserWithProfileResponse.model_validate(user)


# ── Update current user ───────────────────────────────────────────────────────

@router.patch("/me", response_model=UserWithProfileResponse)
async def update_me(
    data: UpdateUserRequest,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    user = await user_service.update_me(db, current_user.id, data)
    return UserWithProfileResponse.model_validate(user)

# ── Admin: update user by id ─────────────────────────────────────────────────

@router.patch("/{user_id}", response_model=UserWithProfileResponse)
async def update_user_by_id(
    user_id: UUID,
    data: UpdateUserRequest,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    user = await user_service.update_user_by_id(db, user_id, data)
    return UserWithProfileResponse.model_validate(user)


# ── Admin: get all users ──────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=list[UserWithProfileResponse],
)
async def get_all_users(
    db: async_session,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
):
    users = await user_service.get_all_users(db, skip=skip, limit=limit)
    return [UserWithProfileResponse.model_validate(u) for u in users]


# ── Admin: get user by id ─────────────────────────────────────────────────────

@router.get("/{user_id}", response_model=UserWithProfileResponse)
async def get_user_by_id(
    user_id: UUID,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    user = await user_service.get_user_by_id(db, user_id)
    return UserWithProfileResponse.model_validate(user)


# ── Admin: delete user ────────────────────────────────────────────────────────

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    await user_service.delete_user(db, user_id)


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: ChangePasswordRequest,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    await user_service.change_password(db, current_user.id, data)

@router.post("/me/avatar", response_model=UserWithProfileResponse)
async def upload_avatar(
    db: async_session,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    _, _, url = await save_upload_file(file)
    user = await user_service.update_me(
        db, current_user.id, UpdateUserRequest(avatar_url=url)
    )
    return UserWithProfileResponse.model_validate(user)
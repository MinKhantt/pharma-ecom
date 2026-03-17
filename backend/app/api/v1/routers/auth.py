import datetime as dt
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from app.core.google_oauth import oauth

from app.db.database import async_session
from app.schemas.user import (
    LoginRequest,
    UserRegisterRequest,
    UserWithProfileResponse,
)
from app.services.user_service import user_service
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token, verify_password
from app.crud.user_crud import user_crud
from app.core.config import settings
from app.core.redis import blacklist_token, is_token_blacklisted
from app.schemas.auth import CreateAdminRequest, RefreshTokenRequest, TokenResponse
from app.api.v1.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

bearer_scheme = HTTPBearer()

# ── Create admin  ─────────────────────────────────────────────
@router.post("/create-admin", status_code=status.HTTP_201_CREATED)
async def create_admin(data: CreateAdminRequest, db: async_session):
    if data.secret_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid secret key",
        )

    user = await user_service.register(db, UserRegisterRequest(
        full_name=data.full_name,
        email=data.email,
        password=data.password,
    ))

    await user_crud.update(db, user, {
        "is_superuser": True,
        "is_profile_complete": True,
    })
    await db.commit()

    # Re-fetch with profile eagerly loaded
    result = await db.execute(
        select(User)
        .where(User.id == user.id)
        .options(selectinload(User.profile))
    )
    user = result.scalar_one()

    return {
        "access_token": create_access_token(str(user.id)),
        "refresh_token": create_refresh_token(str(user.id)),
        "token_type": "bearer",
        "user": UserWithProfileResponse.model_validate(user),
    }


# ── Register ──────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: UserRegisterRequest, db: async_session):
    user = await user_service.register(db, data)
    return {
        "access_token": create_access_token(str(user.id)),
        "refresh_token": create_refresh_token(str(user.id)),
        "token_type": "bearer",
        "user": UserWithProfileResponse.model_validate(user),
    }

@router.post("/login", status_code=status.HTTP_200_OK)
async def login(data: LoginRequest, db: async_session):
    user = await user_crud.get_by_email(db, data.email)

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    return {
        "access_token": create_access_token(str(user.id)),
        "refresh_token": create_refresh_token(str(user.id)),
        "token_type": "bearer",
        "is_profile_complete": user.is_profile_complete,
        "user": UserWithProfileResponse.model_validate(user),
    }

@router.get("/google")
async def google_login(request: Request):
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


# ── Google callback: exchange code for user info ──────────────────────────────

@router.get("/google/callback")
async def google_callback(request: Request, db: async_session):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google authentication failed",
        )

    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not fetch user info from Google",
        )

    user = await user_service.google_login(
        db,
        email=user_info["email"],
        full_name=user_info.get("name", ""),
        avatar_url=user_info.get("picture"),
    )

    return {
        "access_token": create_access_token(str(user.id)),
        "refresh_token": create_refresh_token(str(user.id)),
        "token_type": "bearer",
        "is_profile_complete": user.is_profile_complete,
        "user": UserWithProfileResponse.model_validate(user),
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: async_session):
    """
    Exchange a valid refresh token for a new access + refresh token pair.
    The old refresh token is blacklisted after use (rotation).
    """
    # Check if refresh token is blacklisted
    if await is_token_blacklisted(data.refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    # Decode and validate
    user_id = decode_refresh_token(data.refresh_token)

    # Verify user still exists and is active
    user = await user_crud.get_by_id(db, UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Blacklist the used refresh token (rotation — old token can't be reused)
    payload = jwt.decode(
        data.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
    )
    exp = payload.get("exp")
    remaining = max(int(exp - dt.datetime.now(dt.timezone.utc).timestamp()), 0)
    await blacklist_token(data.refresh_token, remaining)

    # Issue new token pair
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    current_user: User = Depends(get_current_user),
):
    """
    Blacklist the current access token so it can't be used again.
    Frontend should also discard the refresh token from storage.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        exp = payload.get("exp")
        remaining = max(int(exp - dt.datetime.now(dt.timezone.utc).timestamp()), 0)
        await blacklist_token(token, remaining)
    except JWTError:
        pass  # Already invalid — fine
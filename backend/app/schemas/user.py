from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional


# ── Register ──────────────────────────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("full_name cannot be empty")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


# ── Complete profile ───────────────────────────────────────────────────────────

class CompleteProfileRequest(BaseModel):
    phone_number: Optional[str] = None
    date_of_birth: Optional[str] = None    # YYYY-MM-DD
    avatar_url: Optional[str] = None
    address: Optional[str] = None


# ── Response ──────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    is_active: bool
    is_profile_complete: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    id: UUID
    phone_number: Optional[str]
    date_of_birth: Optional[str]
    avatar_url: Optional[str]
    address: Optional[str]

    model_config = {"from_attributes": True}


class UserWithProfileResponse(UserResponse):
    profile: Optional[ProfileResponse] = None
    is_superuser: bool

    model_config = {"from_attributes": True}


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    avatar_url: Optional[str] = None
    address: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("full_name cannot be empty")
        return v.strip() if v else v
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleUserInfo(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v
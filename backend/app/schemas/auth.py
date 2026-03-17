from pydantic import BaseModel, EmailStr


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class CreateAdminRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    secret_key: str
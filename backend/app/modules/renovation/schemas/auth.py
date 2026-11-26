from pydantic import BaseModel, Field

from .common import RequiredText


class DevTokenRequest(BaseModel):
    user_id: RequiredText(1, 64)
    roles: list[str] = Field(min_length=1)
    name: RequiredText(1, 150) | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class PrincipalRead(BaseModel):
    user_id: str
    display_name: str | None
    roles: list[str]
    permissions: list[str]

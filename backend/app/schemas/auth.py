from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    login_id: str = Field(min_length=1, max_length=30)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
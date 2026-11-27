from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.db import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    try:
        token = auth_service.login(db, data.login_id, data.password, ip_address=ip)
    except auth_service.AuthError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    return TokenResponse(access_token=token)

@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "login_id": user.login_id, "role": user.role}
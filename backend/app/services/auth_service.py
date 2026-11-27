from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories import user_repository

# Dummy hash so response time is the same whether or not the user exists
_DUMMY_HASH = hash_password("dummy-password")


class AuthError(Exception):
    pass


def login(db: Session, login_id: str, password: str) -> str:
    user = user_repository.get_by_login_id(db, login_id)
    stored = user.password_hash if user and user.password_hash else _DUMMY_HASH
    ok = verify_password(password, stored)
    if not user or not ok or not user.is_active:
        raise AuthError("Invalid credentials")
    return create_access_token(user.id, user.role)
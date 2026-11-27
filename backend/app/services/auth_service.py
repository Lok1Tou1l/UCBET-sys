from sqlalchemy.orm import Session
from app.services import audit_service
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories import user_repository

# Dummy hash so response time is the same whether or not the user exists
_DUMMY_HASH = hash_password("dummy-password")


class AuthError(Exception):
    pass


def login(db: Session, login_id: str, password: str, ip_address: str | None = None) -> str:
    user = user_repository.get_by_login_id(db, login_id)
    stored = user.password_hash if user and user.password_hash else _DUMMY_HASH
    ok = verify_password(password, stored)
    if not user or not ok or not user.is_active:
        audit_service.record(
            db,
            "auth.login_failed",
            actor_id=user.id if user else None,
            details={"login_id": login_id},
            ip_address=ip_address,
        )
        raise AuthError("Invalid credentials")
    audit_service.record(
        db,
        "auth.login",
        actor_id=user.id,
        entity_type="user",
        entity_id=user.id,
        ip_address=ip_address,
    )
    return create_access_token(user.id, user.role)
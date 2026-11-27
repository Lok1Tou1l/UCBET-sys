import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import decode_access_token, hash_password
from app.db.db import Base
from app.models.models import User
from app.services import auth_service
from app.models.audit import AuditLog


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as s:
        s.add(User(id=1, email="s@x.dz", login_id="2024001",
                   password_hash=hash_password("pass1234"), role="student"))
        s.add(User(id=2, email="off@x.dz", login_id="2024002",
                   password_hash=hash_password("pass1234"), is_active=False))
        s.commit()
        yield s


def test_login_ok(db):
    token = auth_service.login(db, "2024001", "pass1234")
    assert decode_access_token(token)["sub"] == "1"


def test_wrong_password(db):
    with pytest.raises(auth_service.AuthError):
        auth_service.login(db, "2024001", "bad")


def test_unknown_user(db):
    with pytest.raises(auth_service.AuthError):
        auth_service.login(db, "9999999", "pass1234")


def test_inactive_user(db):
    with pytest.raises(auth_service.AuthError):
        auth_service.login(db, "2024002", "pass1234")

def test_login_success_is_audited(db):
    auth_service.login(db, "2024001", "pass1234")
    row = db.query(AuditLog).one()
    assert row.action == "auth.login" and row.actor_id == 1


def test_login_failure_is_audited_without_password(db):
    with pytest.raises(auth_service.AuthError):
        auth_service.login(db, "2024001", "bad-password")
    row = db.query(AuditLog).one()
    assert row.action == "auth.login_failed"
    assert "bad-password" not in (row.details or "")
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user, require_roles
from app.core.security import create_access_token, hash_password
from app.db.db import Base, get_db
from app.models.user import User


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    with Session() as s:
        s.add(User(id=1, email="s@x.dz", login_id="1", password_hash=hash_password("x"), role="student"))
        s.add(User(id=2, email="t@x.dz", login_id="2", password_hash=hash_password("x"), role="teacher"))
        s.add(User(id=3, email="o@x.dz", login_id="3", password_hash=hash_password("x"), role="teacher", is_active=False))
        s.commit()

    app = FastAPI()

    @app.get("/me")
    def me(u: User = Depends(get_current_user)):
        return {"id": u.id}

    @app.get("/teachers")
    def teachers(u: User = Depends(require_roles("teacher"))):
        return {"id": u.id}

    def override_db():
        with Session() as s:
            yield s

    app.dependency_overrides[get_db] = override_db
    return TestClient(app)


def auth(uid, role):
    return {"Authorization": f"Bearer {create_access_token(uid, role)}"}


def test_no_token_401(client):
    assert client.get("/me").status_code == 401


def test_bad_token_401(client):
    assert client.get("/me", headers={"Authorization": "Bearer junk"}).status_code == 401


def test_valid_token_200(client):
    assert client.get("/me", headers=auth(1, "student")).status_code == 200


def test_wrong_role_403(client):
    assert client.get("/teachers", headers=auth(1, "student")).status_code == 403


def test_right_role_200(client):
    assert client.get("/teachers", headers=auth(2, "teacher")).status_code == 200


def test_inactive_user_401(client):
    assert client.get("/me", headers=auth(3, "teacher")).status_code == 401


def test_token_role_ignored_uses_db_role(client):
    
    assert client.get("/teachers", headers=auth(1, "teacher")).status_code == 403
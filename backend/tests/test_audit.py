import json

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.db import Base
from app.models.audit import AuditLog
from app.services import audit_service


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as s:
        yield s


def test_record_saves_entry(db):
    audit_service.record(db, "auth.login", actor_id=None, details={"login_id": "2024001"})
    row = db.query(AuditLog).one()
    assert row.action == "auth.login"
    assert json.loads(row.details) == {"login_id": "2024001"}


def test_sensitive_keys_are_stripped(db):
    audit_service.record(db, "x", details={"password": "p", "token": "t", "ok": 1})
    row = db.query(AuditLog).one()
    assert json.loads(row.details) == {"ok": 1}


def test_entity_id_stored_as_string(db):
    audit_service.record(db, "user.role_changed", entity_type="user", entity_id=5)
    assert db.query(AuditLog).one().entity_id == "5"
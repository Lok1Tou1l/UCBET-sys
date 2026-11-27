import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.db import Base
from app.models.user import User
from app.services import user_import_service as svc


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as s:
        s.add(User(id=1, email="a@x.dz", login_id="admin01", role="admin"))
        s.commit()
        yield s


def csv_bytes(text: str) -> bytes:
    return text.encode("utf-8")


def test_import_creates_valid_rows(db):
    data = "login_id,email,role\n2024001,s1@x.dz,student\n2024002,s2@x.dz,student\n"
    report = svc.import_users(db, csv_bytes(data), actor_id=1)
    assert len(report.created) == 2 and not report.rejected
    assert db.query(User).count() == 3


def test_rejects_bad_rows_with_reasons(db):
    data = (
        "login_id,email,role\n"
        "2024001,bad-email,student\n"
        "2024002,ok@x.dz,hacker\n"
        "admin01,dup@x.dz,student\n"
    )
    report = svc.import_users(db, csv_bytes(data), actor_id=1)
    assert [r.reason for r in report.rejected] == [
        "Invalid email", "Invalid role", "Duplicate login_id",
    ]
    assert not report.created


def test_duplicate_inside_file_rejected(db):
    data = "login_id,email,role\n2024001,a@x.dz,student\n2024001,b@x.dz,student\n"
    report = svc.import_users(db, csv_bytes(data), actor_id=1)
    assert len(report.created) == 1 and report.rejected[0].reason == "Duplicate login_id"


def test_missing_columns_raises(db):
    with pytest.raises(svc.ImportError_):
        svc.import_users(db, csv_bytes("login_id,email\n1,a@x.dz\n"), actor_id=1)


def test_temp_password_not_stored_in_plaintext(db):
    data = "login_id,email,role\n2024001,s1@x.dz,student\n"
    report = svc.import_users(db, csv_bytes(data), actor_id=1)
    user = db.query(User).filter(User.login_id == "2024001").one()
    assert user.password_hash != report.created[0].temp_password
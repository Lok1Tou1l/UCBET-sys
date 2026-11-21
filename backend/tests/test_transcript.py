from decimal import Decimal
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.db import Base
from app.models.models import Assessment, Grade, Student, Subject, User
from app.services.transcript_service import build_transcript

@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as s:
        s.add_all([
            User(id=1, email="t@x.dz"),
            Student(id=1, full_name="A"),
            Subject(id=1, name="Math"),
            Assessment(id=1, subject_id=1, type="cc", weight=Decimal("40"), max_score=Decimal("20")),
            Assessment(id=2, subject_id=1, type="exam", weight=Decimal("60"), max_score=Decimal("20")),
        ])
        s.commit()
        yield s


def add(db, aid, value=None, absence=None, status="published"):
    db.add(Grade(assessment_id=aid, student_id=1, value=value, absence_code=absence,
                 status=status, locked=(status == "published"), created_by=1))
    db.commit()


def avg(db):
    return build_transcript(db, 1)["subjects"][0]["average"]


def test_weighted_average(db):
    add(db, 1, Decimal("10"))
    add(db, 2, Decimal("16"))
    assert avg(db) == Decimal("13.60")


def test_unpublished_ignored(db):
    add(db, 1, Decimal("10"), status="validated")
    assert build_transcript(db, 1)["subjects"] == []


def test_abs_counts_zero(db):
    add(db, 1, absence="ABS")
    add(db, 2, Decimal("16"))
    assert avg(db) == Decimal("9.60")


def test_abj_is_excluded(db):
    add(db, 1, absence="ABJ")
    add(db, 2, Decimal("16"))
    assert avg(db) == Decimal("16.00")
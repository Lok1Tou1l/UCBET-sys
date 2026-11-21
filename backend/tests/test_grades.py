from decimal import Decimal
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.db import Base
from app.models.models import Assessment, GradeChange, Student, Subject, User
from app.services.grade_service import (
    GradeError, change_status, create_grade, edit_grade,
)


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as s:
        s.add_all([
            User(id=1, email="t@x.dz"),
            Student(id=1, full_name="Student A"),
            Subject(id=1, name="Math"),
            Assessment(id=1, subject_id=1, type="exam", weight=Decimal("100"), max_score=Decimal("20")),
        ])
        s.commit()
        yield s


def new_grade(db, value="12"):
    return create_grade(db, 1, 1, Decimal(value), None, actor_id=1)


def test_create_logs_history(db):
    new_grade(db)
    assert db.query(GradeChange).count() == 1


def test_edit_logs_old_and_new(db):
    g = new_grade(db, "12")
    edit_grade(db, g, Decimal("15"), None, actor_id=1)
    last = db.query(GradeChange).order_by(GradeChange.id.desc()).first()
    assert (last.old_value, last.new_value) == (Decimal("12"), Decimal("15"))


def test_out_of_range_rejected(db):
    with pytest.raises(GradeError):
        new_grade(db, "25")


def test_duplicate_rejected(db):
    new_grade(db)
    with pytest.raises(GradeError):
        new_grade(db)


def test_bad_transition_rejected(db):
    g = new_grade(db)
    with pytest.raises(GradeError):
        change_status(db, g, "published", actor_id=1)  #  not allowed


def test_reject_needs_reason(db):
    g = new_grade(db)
    change_status(db, g, "submitted", actor_id=1)
    with pytest.raises(GradeError):
        change_status(db, g, "draft", actor_id=1)


def test_published_is_locked(db):
    g = new_grade(db)
    for step in ("submitted", "validated", "published"):
        change_status(db, g, step, actor_id=1)
    assert g.locked
    with pytest.raises(GradeError):
        edit_grade(db, g, Decimal("10"), None, actor_id=1)
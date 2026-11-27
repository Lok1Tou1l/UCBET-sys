from datetime import datetime
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.db import Base # cz db\db.py use same pth in ftr file
from app.models.user import User  # noqa: F401  (reused for all the code)


# TEMP hmd / Mahzem model  in dev | this is Ahmed and i create my model {user} 
# class User(Base):
#     __tablename__ = "users"
#     id: Mapped[int] = mapped_column(primary_key=True)
#     email: Mapped[str] = mapped_column(String(120))


class Student(Base):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))


class Subject(Base):
    __tablename__ = "subjects"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
# ---------------------------------------------------------------------------


class Assessment(Base):
    __tablename__ = "assessments"
    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    type: Mapped[str] = mapped_column(String(10))  # micro-intero| td_tp | exam | rtrpg
    weight: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    max_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=20)


class Grade(Base):
    __tablename__ = "grades"
    __table_args__ = (UniqueConstraint("assessment_id", "student_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    value: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    absence_code: Mapped[str | None] = mapped_column(String(5))  
    status: Mapped[str] = mapped_column(String(15), default="draft")
    locked: Mapped[bool] = mapped_column(default=False)
    source: Mapped[str] = mapped_column(String(10), default="manual") 
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))


class GradeChange(Base):
    __tablename__ = "grade_changes"
    id: Mapped[int] = mapped_column(primary_key=True)
    grade_id: Mapped[int] = mapped_column(ForeignKey("grades.id"), index=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    old_value: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    new_value: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    old_status: Mapped[str | None] = mapped_column(String(15))
    new_status: Mapped[str | None] = mapped_column(String(15))
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
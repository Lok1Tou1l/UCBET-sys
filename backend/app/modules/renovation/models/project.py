from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import TABLE_PREFIX, Base, TimestampMixin
from ..db.types import UTCDateTime
from ..utils.time import today, utcnow
from .contractor import Contractor
from .enums import TERMINAL_STATUSES, ProjectStatus

if TYPE_CHECKING:
    from .document import ProjectDocument


def _status_enum(name: str) -> Enum:
    return Enum(
        ProjectStatus,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=20,
        values_callable=lambda enum: [member.value for member in enum],
    )


class RenovationProject(TimestampMixin, Base):
    __tablename__ = f"{TABLE_PREFIX}projects"
    __table_args__ = (
        CheckConstraint("progress_percent BETWEEN 0 AND 100", name="progress_range"),
        CheckConstraint(
            "planned_start_date IS NULL OR planned_end_date IS NULL "
            "OR planned_end_date >= planned_start_date",
            name="planned_dates_order",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    reference_code: Mapped[str] = mapped_column(String(40), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    building: Mapped[str] = mapped_column(String(150), index=True)
    location: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[ProjectStatus] = mapped_column(
        _status_enum("project_status"), default=ProjectStatus.PLANNED, index=True
    )
    planned_start_date: Mapped[date | None] = mapped_column(Date)
    planned_end_date: Mapped[date | None] = mapped_column(Date, index=True)
    actual_start_date: Mapped[date | None] = mapped_column(Date)
    actual_end_date: Mapped[date | None] = mapped_column(Date)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    current_phase: Mapped[str | None] = mapped_column(String(100))
    created_by: Mapped[str] = mapped_column(String(64))

    assignments: Mapped[list["ProjectAssignment"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ProjectAssignment.assigned_at",
    )
    current_assignment: Mapped["ProjectAssignment | None"] = relationship(
        primaryjoin="and_(RenovationProject.id == ProjectAssignment.project_id, "
        "ProjectAssignment.ended_at.is_(None))",
        viewonly=True,
        uselist=False,
        lazy="selectin",
    )
    status_history: Mapped[list["ProjectStatusHistory"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ProjectStatusHistory.changed_at",
    )
    progress_updates: Mapped[list["ProgressUpdate"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ProgressUpdate.reported_at",
    )
    documents: Mapped[list["ProjectDocument"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def current_contractor(self) -> Contractor | None:
        return self.current_assignment.contractor if self.current_assignment else None

    @property
    def is_overdue(self) -> bool:
        return (
            self.planned_end_date is not None
            and self.status not in TERMINAL_STATUSES
            and self.planned_end_date < today()
        )


class ProjectAssignment(Base):
    __tablename__ = f"{TABLE_PREFIX}project_assignments"
    __table_args__ = (
        Index(
            "uq_renovation_project_assignments_one_active",
            "project_id",
            unique=True,
            sqlite_where=text("ended_at IS NULL"),
            postgresql_where=text("ended_at IS NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey(f"{TABLE_PREFIX}projects.id", ondelete="CASCADE"), index=True
    )
    contractor_id: Mapped[int] = mapped_column(
        ForeignKey(f"{TABLE_PREFIX}contractors.id", ondelete="RESTRICT"), index=True
    )
    note: Mapped[str | None] = mapped_column(String(500))
    assigned_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
    assigned_by: Mapped[str] = mapped_column(String(64))
    ended_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    ended_by: Mapped[str | None] = mapped_column(String(64))
    end_reason: Mapped[str | None] = mapped_column(String(500))

    project: Mapped[RenovationProject] = relationship(back_populates="assignments")
    contractor: Mapped[Contractor] = relationship(back_populates="assignments", lazy="joined")

    @property
    def is_active(self) -> bool:
        return self.ended_at is None


class ProjectStatusHistory(Base):
    __tablename__ = f"{TABLE_PREFIX}project_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey(f"{TABLE_PREFIX}projects.id", ondelete="CASCADE"), index=True
    )
    from_status: Mapped[ProjectStatus | None] = mapped_column(_status_enum("history_from_status"))
    to_status: Mapped[ProjectStatus] = mapped_column(_status_enum("history_to_status"))
    reason: Mapped[str | None] = mapped_column(String(500))
    changed_by: Mapped[str] = mapped_column(String(64))
    changed_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)

    project: Mapped[RenovationProject] = relationship(back_populates="status_history")


class ProgressUpdate(Base):
    __tablename__ = f"{TABLE_PREFIX}progress_updates"
    __table_args__ = (
        CheckConstraint("percent BETWEEN 0 AND 100", name="percent_range"),
        CheckConstraint("previous_percent BETWEEN 0 AND 100", name="previous_percent_range"),
        Index("ix_renovation_progress_updates_project_reported", "project_id", "reported_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey(f"{TABLE_PREFIX}projects.id", ondelete="CASCADE"))
    percent: Mapped[int] = mapped_column(Integer)
    previous_percent: Mapped[int] = mapped_column(Integer)
    phase: Mapped[str | None] = mapped_column(String(100))
    note: Mapped[str | None] = mapped_column(Text)
    reported_by: Mapped[str] = mapped_column(String(64))
    reported_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, index=True)

    project: Mapped[RenovationProject] = relationship(back_populates="progress_updates")

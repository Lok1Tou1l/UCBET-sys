from collections.abc import Sequence
from datetime import datetime
from typing import Any

from sqlalchemy import Row, case, func, select
from sqlalchemy.orm import Session

from ..models import (
    Contractor,
    ContractorStatus,
    ProgressUpdate,
    ProjectAssignment,
    ProjectDocument,
    ProjectStatus,
    RenovationProject,
)
from ..models.enums import OPEN_STATUSES
from .projects import overdue_condition


def project_counts_by_status(session: Session) -> dict[ProjectStatus, int]:
    rows = session.execute(
        select(RenovationProject.status, func.count()).group_by(RenovationProject.status)
    ).all()
    return {status: count for status, count in rows}


def overdue_project_count(session: Session) -> int:
    return session.scalar(select(func.count()).select_from(RenovationProject).where(overdue_condition())) or 0


def average_active_progress(session: Session) -> float | None:
    value = session.scalar(
        select(func.avg(RenovationProject.progress_percent)).where(
            RenovationProject.status == ProjectStatus.ACTIVE
        )
    )
    return round(float(value), 1) if value is not None else None


def contractor_counts_by_status(session: Session) -> dict[ContractorStatus, int]:
    rows = session.execute(select(Contractor.status, func.count()).group_by(Contractor.status)).all()
    return {status: count for status, count in rows}


def contractors_with_open_projects(session: Session) -> int:
    return (
        session.scalar(
            select(func.count(func.distinct(ProjectAssignment.contractor_id)))
            .join(RenovationProject, RenovationProject.id == ProjectAssignment.project_id)
            .where(ProjectAssignment.ended_at.is_(None), RenovationProject.status.in_(OPEN_STATUSES))
        )
        or 0
    )


def active_document_count(session: Session) -> int:
    return (
        session.scalar(
            select(func.count()).select_from(ProjectDocument).where(ProjectDocument.deleted_at.is_(None))
        )
        or 0
    )


def progress_updates_since(session: Session, since: datetime) -> int:
    return (
        session.scalar(
            select(func.count()).select_from(ProgressUpdate).where(ProgressUpdate.reported_at >= since)
        )
        or 0
    )


def contractor_stats(session: Session, *, status: ContractorStatus | None, limit: int) -> Sequence[Row[Any]]:
    """Projects are counted once per contractor and attributed to whoever is currently assigned."""
    current = ProjectAssignment.ended_at.is_(None)
    open_projects = func.count(
        func.distinct(case((current & RenovationProject.status.in_(OPEN_STATUSES), RenovationProject.id)))
    )
    completed_projects = func.count(
        func.distinct(
            case((current & (RenovationProject.status == ProjectStatus.COMPLETED), RenovationProject.id))
        )
    )
    total_projects = func.count(func.distinct(ProjectAssignment.project_id))
    stmt = (
        select(
            Contractor,
            open_projects.label("open_projects"),
            completed_projects.label("completed_projects"),
            total_projects.label("total_projects"),
        )
        .outerjoin(ProjectAssignment, ProjectAssignment.contractor_id == Contractor.id)
        .outerjoin(RenovationProject, RenovationProject.id == ProjectAssignment.project_id)
        .group_by(Contractor.id)
        .order_by(open_projects.desc(), total_projects.desc(), Contractor.company_name)
        .limit(limit)
    )
    if status:
        stmt = stmt.where(Contractor.status == status)
    return session.execute(stmt).all()


def progress_overview(
    session: Session, *, statuses: tuple[ProjectStatus, ...], limit: int
) -> Sequence[Row[Any]]:
    last_progress = (
        select(ProgressUpdate.project_id, func.max(ProgressUpdate.reported_at).label("last_at"))
        .group_by(ProgressUpdate.project_id)
        .subquery()
    )
    stmt = (
        select(RenovationProject, last_progress.c.last_at)
        .outerjoin(last_progress, last_progress.c.project_id == RenovationProject.id)
        .where(RenovationProject.status.in_(statuses))
        .order_by(
            RenovationProject.planned_end_date.is_(None),
            RenovationProject.planned_end_date.asc(),
            RenovationProject.id,
        )
        .limit(limit)
    )
    return session.execute(stmt).all()

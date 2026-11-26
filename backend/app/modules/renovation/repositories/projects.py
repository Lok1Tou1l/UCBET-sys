from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date

from sqlalchemy import Select, exists, func, or_, select
from sqlalchemy.orm import Session

from ..models import (
    ProgressUpdate,
    ProjectAssignment,
    ProjectDocument,
    ProjectStatus,
    ProjectStatusHistory,
    RenovationProject,
)
from ..models.enums import OPEN_STATUSES
from ..utils.pagination import PageRequest, apply_sort, like_pattern, paginate
from ..utils.time import today

SORTABLE = {
    "id": RenovationProject.id,
    "title": RenovationProject.title,
    "reference_code": RenovationProject.reference_code,
    "building": RenovationProject.building,
    "status": RenovationProject.status,
    "progress_percent": RenovationProject.progress_percent,
    "planned_start_date": RenovationProject.planned_start_date,
    "planned_end_date": RenovationProject.planned_end_date,
    "created_at": RenovationProject.created_at,
    "updated_at": RenovationProject.updated_at,
}


@dataclass(frozen=True)
class ProjectFilters:
    search: str | None = None
    statuses: tuple[ProjectStatus, ...] = ()
    building: str | None = None
    contractor_id: int | None = None
    unassigned: bool | None = None
    overdue: bool | None = None
    deadline_from: date | None = None
    deadline_to: date | None = None


def get(session: Session, project_id: int) -> RenovationProject | None:
    return session.get(RenovationProject, project_id)


def _active_assignment_exists(contractor_id: int | None = None):
    condition = exists().where(
        ProjectAssignment.project_id == RenovationProject.id,
        ProjectAssignment.ended_at.is_(None),
    )
    if contractor_id is not None:
        condition = condition.where(ProjectAssignment.contractor_id == contractor_id)
    return condition


def overdue_condition(reference: date | None = None):
    reference = reference or today()
    return (
        RenovationProject.planned_end_date.is_not(None)
        & (RenovationProject.planned_end_date < reference)
        & RenovationProject.status.in_(OPEN_STATUSES)
    )


def _filtered(filters: ProjectFilters) -> Select[tuple[RenovationProject]]:
    stmt = select(RenovationProject)
    if filters.search:
        pattern = like_pattern(filters.search)
        stmt = stmt.where(
            or_(
                *(
                    column.ilike(pattern, escape="\\")
                    for column in (
                        RenovationProject.title,
                        RenovationProject.reference_code,
                        RenovationProject.building,
                        RenovationProject.location,
                        RenovationProject.description,
                    )
                )
            )
        )
    if filters.statuses:
        stmt = stmt.where(RenovationProject.status.in_(filters.statuses))
    if filters.building:
        stmt = stmt.where(func.lower(RenovationProject.building) == filters.building.lower())
    if filters.contractor_id is not None:
        stmt = stmt.where(_active_assignment_exists(filters.contractor_id))
    if filters.unassigned is True:
        stmt = stmt.where(~_active_assignment_exists())
    elif filters.unassigned is False:
        stmt = stmt.where(_active_assignment_exists())
    if filters.overdue is True:
        stmt = stmt.where(overdue_condition())
    elif filters.overdue is False:
        stmt = stmt.where(~overdue_condition())
    if filters.deadline_from:
        stmt = stmt.where(RenovationProject.planned_end_date >= filters.deadline_from)
    if filters.deadline_to:
        stmt = stmt.where(RenovationProject.planned_end_date <= filters.deadline_to)
    return stmt


def list_page(
    session: Session, filters: ProjectFilters, page: PageRequest, sort: str | None
) -> tuple[Sequence[RenovationProject], int]:
    stmt = apply_sort(_filtered(filters), sort, SORTABLE, default="-created_at")
    return paginate(session, stmt, page)


def count_progress_updates(session: Session, project_id: int) -> int:
    return (
        session.scalar(
            select(func.count()).select_from(ProgressUpdate).where(ProgressUpdate.project_id == project_id)
        )
        or 0
    )


def count_documents(session: Session, project_id: int, *, include_deleted: bool = False) -> int:
    stmt = select(func.count()).select_from(ProjectDocument).where(ProjectDocument.project_id == project_id)
    if not include_deleted:
        stmt = stmt.where(ProjectDocument.deleted_at.is_(None))
    return session.scalar(stmt) or 0


def status_history(session: Session, project_id: int) -> Sequence[ProjectStatusHistory]:
    return session.scalars(
        select(ProjectStatusHistory)
        .where(ProjectStatusHistory.project_id == project_id)
        .order_by(ProjectStatusHistory.changed_at.desc(), ProjectStatusHistory.id.desc())
    ).all()


def assignments(session: Session, project_id: int) -> Sequence[ProjectAssignment]:
    return session.scalars(
        select(ProjectAssignment)
        .where(ProjectAssignment.project_id == project_id)
        .order_by(ProjectAssignment.assigned_at.desc(), ProjectAssignment.id.desc())
    ).all()


def progress_page(
    session: Session, project_id: int, page: PageRequest
) -> tuple[Sequence[ProgressUpdate], int]:
    stmt = (
        select(ProgressUpdate)
        .where(ProgressUpdate.project_id == project_id)
        .order_by(ProgressUpdate.reported_at.desc(), ProgressUpdate.id.desc())
    )
    return paginate(session, stmt, page)


def latest_progress(session: Session, project_id: int) -> ProgressUpdate | None:
    return session.scalar(
        select(ProgressUpdate)
        .where(ProgressUpdate.project_id == project_id)
        .order_by(ProgressUpdate.reported_at.desc(), ProgressUpdate.id.desc())
        .limit(1)
    )

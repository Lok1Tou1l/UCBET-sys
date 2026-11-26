from collections.abc import Sequence
from dataclasses import dataclass

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from ..models import Contractor, ContractorStatus, ProjectAssignment, RenovationProject
from ..models.enums import OPEN_STATUSES
from ..utils.pagination import PageRequest, apply_sort, like_pattern, paginate

SORTABLE = {
    "id": Contractor.id,
    "company_name": Contractor.company_name,
    "city": Contractor.city,
    "status": Contractor.status,
    "created_at": Contractor.created_at,
}


@dataclass(frozen=True)
class ContractorFilters:
    search: str | None = None
    status: ContractorStatus | None = None
    specialty: str | None = None
    city: str | None = None


def get(session: Session, contractor_id: int) -> Contractor | None:
    return session.get(Contractor, contractor_id)


def get_by_registration_number(session: Session, registration_number: str) -> Contractor | None:
    return session.scalar(select(Contractor).where(Contractor.registration_number == registration_number))


def _filtered(filters: ContractorFilters) -> Select[tuple[Contractor]]:
    stmt = select(Contractor)
    if filters.search:
        pattern = like_pattern(filters.search)
        stmt = stmt.where(
            or_(
                *(
                    column.ilike(pattern, escape="\\")
                    for column in (
                        Contractor.company_name,
                        Contractor.registration_number,
                        Contractor.contact_name,
                        Contractor.email,
                        Contractor.city,
                        Contractor.specialty,
                    )
                )
            )
        )
    if filters.status:
        stmt = stmt.where(Contractor.status == filters.status)
    if filters.specialty:
        stmt = stmt.where(func.lower(Contractor.specialty) == filters.specialty.lower())
    if filters.city:
        stmt = stmt.where(func.lower(Contractor.city) == filters.city.lower())
    return stmt


def list_page(
    session: Session, filters: ContractorFilters, page: PageRequest, sort: str | None
) -> tuple[Sequence[Contractor], int]:
    stmt = apply_sort(_filtered(filters), sort, SORTABLE, default="company_name")
    return paginate(session, stmt, page)


def count_assignments(session: Session, contractor_id: int) -> int:
    return (
        session.scalar(
            select(func.count())
            .select_from(ProjectAssignment)
            .where(ProjectAssignment.contractor_id == contractor_id)
        )
        or 0
    )


def open_projects_assigned(session: Session, contractor_id: int) -> Sequence[RenovationProject]:
    return session.scalars(
        select(RenovationProject)
        .join(ProjectAssignment, ProjectAssignment.project_id == RenovationProject.id)
        .where(
            ProjectAssignment.contractor_id == contractor_id,
            ProjectAssignment.ended_at.is_(None),
            RenovationProject.status.in_(OPEN_STATUSES),
        )
        .order_by(RenovationProject.id)
    ).all()


def assignment_history(
    session: Session, contractor_id: int, page: PageRequest
) -> tuple[Sequence[ProjectAssignment], int]:
    stmt = (
        select(ProjectAssignment)
        .where(ProjectAssignment.contractor_id == contractor_id)
        .order_by(ProjectAssignment.assigned_at.desc(), ProjectAssignment.id.desc())
    )
    return paginate(session, stmt, page)

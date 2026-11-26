from collections.abc import Sequence

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core.errors import ConflictError, NotFoundError
from ..core.security import Principal
from ..models import Contractor, ContractorStatus, ProjectAssignment
from ..repositories import activity
from ..repositories import contractors as repo
from ..repositories.contractors import ContractorFilters
from ..schemas.contractor import ContractorCreate, ContractorDetail, ContractorRead, ContractorUpdate
from ..utils.pagination import PageRequest


def get_or_404(session: Session, contractor_id: int) -> Contractor:
    contractor = repo.get(session, contractor_id)
    if contractor is None:
        raise NotFoundError(f"Contractor {contractor_id} not found")
    return contractor


def _ensure_registration_available(
    session: Session, registration_number: str, *, exclude_id: int | None = None
) -> None:
    existing = repo.get_by_registration_number(session, registration_number)
    if existing is not None and existing.id != exclude_id:
        raise ConflictError(
            "A contractor with this registration number already exists",
            details={"contractor_id": existing.id},
        )


def _commit(session: Session) -> None:
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise ConflictError("The change conflicts with existing contractor data") from exc


def list_contractors(
    session: Session, filters: ContractorFilters, page: PageRequest, sort: str | None
) -> tuple[Sequence[Contractor], int]:
    return repo.list_page(session, filters, page, sort)


def get_detail(session: Session, contractor_id: int) -> ContractorDetail:
    contractor = get_or_404(session, contractor_id)
    return ContractorDetail(
        **ContractorRead.model_validate(contractor).model_dump(),
        active_project_count=len(repo.open_projects_assigned(session, contractor_id)),
        total_assignment_count=repo.count_assignments(session, contractor_id),
    )


def create(session: Session, data: ContractorCreate, actor: Principal) -> Contractor:
    _ensure_registration_available(session, data.registration_number)
    contractor = Contractor(**data.model_dump(), created_by=actor.user_id)
    session.add(contractor)
    session.flush()
    activity.add(
        session,
        actor_id=actor.user_id,
        action="contractor.created",
        entity_type="contractor",
        entity_id=contractor.id,
        summary=f"Contractor '{contractor.company_name}' created",
    )
    _commit(session)
    session.refresh(contractor)
    return contractor


def update(session: Session, contractor_id: int, data: ContractorUpdate, actor: Principal) -> Contractor:
    contractor = get_or_404(session, contractor_id)
    changes = data.model_dump(exclude_unset=True)

    new_registration = changes.get("registration_number")
    if new_registration and new_registration != contractor.registration_number:
        _ensure_registration_available(session, new_registration, exclude_id=contractor.id)

    new_status = changes.get("status")
    if new_status and new_status != ContractorStatus.ACTIVE and contractor.status == ContractorStatus.ACTIVE:
        open_projects = repo.open_projects_assigned(session, contractor.id)
        if open_projects:
            raise ConflictError(
                "Reassign or close this contractor's open projects before changing its status",
                details={"projects": [p.reference_code for p in open_projects]},
            )

    status_changed = new_status is not None and new_status != contractor.status
    for field, value in changes.items():
        setattr(contractor, field, value)

    if changes:
        summary = f"Contractor '{contractor.company_name}' updated ({', '.join(sorted(changes))})"
        if status_changed:
            summary = f"Contractor '{contractor.company_name}' status set to {new_status}"
        activity.add(
            session,
            actor_id=actor.user_id,
            action="contractor.updated",
            entity_type="contractor",
            entity_id=contractor.id,
            summary=summary,
        )
    _commit(session)
    session.refresh(contractor)
    return contractor


def delete(session: Session, contractor_id: int, actor: Principal) -> None:
    contractor = get_or_404(session, contractor_id)
    if repo.count_assignments(session, contractor_id):
        raise ConflictError(
            "Contractor has assignment history and cannot be deleted; set its status to inactive instead"
        )
    activity.add(
        session,
        actor_id=actor.user_id,
        action="contractor.deleted",
        entity_type="contractor",
        entity_id=contractor.id,
        summary=f"Contractor '{contractor.company_name}' deleted",
    )
    session.delete(contractor)
    _commit(session)


def assignment_history(
    session: Session, contractor_id: int, page: PageRequest
) -> tuple[Sequence[ProjectAssignment], int]:
    get_or_404(session, contractor_id)
    return repo.assignment_history(session, contractor_id, page)

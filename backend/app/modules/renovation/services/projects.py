import uuid
from collections.abc import Sequence

from sqlalchemy.orm import Session

from ..core.errors import BusinessValidationError, ConflictError, InvalidStateError, NotFoundError
from ..core.security import Principal
from ..models import (
    ContractorStatus,
    ProjectAssignment,
    ProjectStatus,
    ProjectStatusHistory,
    RenovationProject,
)
from ..models.enums import ALLOWED_STATUS_TRANSITIONS, STATUSES_REQUIRING_REASON, TERMINAL_STATUSES
from ..repositories import activity
from ..repositories import projects as repo
from ..repositories.projects import ProjectFilters
from ..schemas.project import ProjectCreate, ProjectUpdate
from ..utils.pagination import PageRequest
from ..utils.time import today
from . import contractors as contractor_service
from .storage import FileStorage


def get_or_404(session: Session, project_id: int) -> RenovationProject:
    project = repo.get(session, project_id)
    if project is None:
        raise NotFoundError(f"Project {project_id} not found")
    return project


def ensure_open(project: RenovationProject, action: str) -> None:
    if project.status in TERMINAL_STATUSES:
        raise InvalidStateError(f"Cannot {action} a {project.status} project")


def list_projects(
    session: Session, filters: ProjectFilters, page: PageRequest, sort: str | None
) -> tuple[Sequence[RenovationProject], int]:
    return repo.list_page(session, filters, page, sort)


def create(session: Session, data: ProjectCreate, actor: Principal) -> RenovationProject:
    contractor = None
    if data.contractor_id is not None:
        contractor = contractor_service.get_or_404(session, data.contractor_id)
        if contractor.status != ContractorStatus.ACTIVE:
            raise InvalidStateError("Only active contractors can be assigned to projects")

    project = RenovationProject(
        **data.model_dump(exclude={"contractor_id"}),
        reference_code=f"pending-{uuid.uuid4().hex}",
        status=ProjectStatus.PLANNED,
        progress_percent=0,
        created_by=actor.user_id,
    )
    session.add(project)
    session.flush()
    project.reference_code = f"RP-{project.created_at.year}-{project.id:05d}"
    session.add(
        ProjectStatusHistory(
            project_id=project.id,
            from_status=None,
            to_status=ProjectStatus.PLANNED,
            reason="Project created",
            changed_by=actor.user_id,
        )
    )
    activity.add(
        session,
        actor_id=actor.user_id,
        action="project.created",
        entity_type="project",
        entity_id=project.id,
        project_id=project.id,
        summary=f"Project {project.reference_code} '{project.title}' created",
    )
    if contractor is not None:
        assignment = ProjectAssignment(
            project_id=project.id, contractor_id=contractor.id, assigned_by=actor.user_id
        )
        session.add(assignment)
        session.flush()
        activity.add(
            session,
            actor_id=actor.user_id,
            action="project.assigned",
            entity_type="assignment",
            entity_id=assignment.id,
            project_id=project.id,
            summary=f"{contractor.company_name} assigned to {project.reference_code}",
        )
    session.commit()
    session.refresh(project)
    return project


def update(session: Session, project_id: int, data: ProjectUpdate, actor: Principal) -> RenovationProject:
    project = get_or_404(session, project_id)
    ensure_open(project, "edit")
    changes = data.model_dump(exclude_unset=True)

    start = changes.get("planned_start_date", project.planned_start_date)
    end = changes.get("planned_end_date", project.planned_end_date)
    if start and end and end < start:
        raise BusinessValidationError("planned_end_date must not be before planned_start_date")

    for field, value in changes.items():
        setattr(project, field, value)
    if changes:
        activity.add(
            session,
            actor_id=actor.user_id,
            action="project.updated",
            entity_type="project",
            entity_id=project.id,
            project_id=project.id,
            summary=f"Project {project.reference_code} updated ({', '.join(sorted(changes))})",
        )
    session.commit()
    session.refresh(project)
    return project


def change_status(
    session: Session,
    project_id: int,
    target: ProjectStatus,
    reason: str | None,
    actor: Principal,
) -> RenovationProject:
    project = get_or_404(session, project_id)
    current = project.status
    if target == current:
        raise InvalidStateError(f"Project is already {current}")
    if target not in ALLOWED_STATUS_TRANSITIONS[current]:
        raise InvalidStateError(
            f"Cannot change status from {current} to {target}",
            details={"allowed": sorted(ALLOWED_STATUS_TRANSITIONS[current])},
        )
    if target in STATUSES_REQUIRING_REASON and not reason:
        raise BusinessValidationError(f"A reason is required to set a project to {target}")
    if target == ProjectStatus.ACTIVE and project.current_assignment is None:
        raise InvalidStateError("Assign a contractor before activating the project")
    if target == ProjectStatus.COMPLETED and project.progress_percent < 100:
        raise InvalidStateError(
            "Record 100% progress before completing the project",
            details={"progress_percent": project.progress_percent},
        )

    project.status = target
    if target == ProjectStatus.ACTIVE and project.actual_start_date is None:
        project.actual_start_date = today()
    if target == ProjectStatus.COMPLETED:
        project.actual_end_date = today()

    session.add(
        ProjectStatusHistory(
            project_id=project.id,
            from_status=current,
            to_status=target,
            reason=reason,
            changed_by=actor.user_id,
        )
    )
    summary = f"{project.reference_code} status {current} → {target}"
    activity.add(
        session,
        actor_id=actor.user_id,
        action="project.status_changed",
        entity_type="project",
        entity_id=project.id,
        project_id=project.id,
        summary=f"{summary}: {reason}" if reason else summary,
    )
    session.commit()
    session.refresh(project)
    return project


def delete(session: Session, project_id: int, actor: Principal, storage: FileStorage) -> None:
    project = get_or_404(session, project_id)
    if project.status != ProjectStatus.PLANNED:
        raise InvalidStateError("Only planned projects can be deleted; cancel the project instead")
    if repo.count_progress_updates(session, project_id) or repo.count_documents(
        session, project_id, include_deleted=True
    ):
        raise ConflictError(
            "Project has progress or document history and cannot be deleted; cancel it instead"
        )
    activity.add(
        session,
        actor_id=actor.user_id,
        action="project.deleted",
        entity_type="project",
        entity_id=project.id,
        project_id=project.id,
        summary=f"Project {project.reference_code} '{project.title}' deleted",
    )
    session.delete(project)
    session.commit()
    storage.remove_project_dir(project_id)


def status_history(session: Session, project_id: int) -> Sequence[ProjectStatusHistory]:
    get_or_404(session, project_id)
    return repo.status_history(session, project_id)

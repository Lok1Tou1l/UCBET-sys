from collections.abc import Sequence

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core.errors import ConflictError, InvalidStateError
from ..core.security import Principal
from ..models import ContractorStatus, ProjectAssignment, ProjectStatus
from ..repositories import activity
from ..repositories import projects as project_repo
from ..utils.time import utcnow
from . import contractors as contractor_service
from . import projects as project_service


def history(session: Session, project_id: int) -> Sequence[ProjectAssignment]:
    project_service.get_or_404(session, project_id)
    return project_repo.assignments(session, project_id)


def assign(
    session: Session, project_id: int, contractor_id: int, note: str | None, actor: Principal
) -> ProjectAssignment:
    """Assigns a contractor; if one is already assigned, the current assignment is closed first."""
    project = project_service.get_or_404(session, project_id)
    project_service.ensure_open(project, "assign contractors to")
    contractor = contractor_service.get_or_404(session, contractor_id)
    if contractor.status != ContractorStatus.ACTIVE:
        raise InvalidStateError("Only active contractors can be assigned to projects")

    previous = project.current_assignment
    if previous is not None and previous.contractor_id == contractor_id:
        raise ConflictError("This contractor is already assigned to the project")

    if previous is not None:
        previous.ended_at = utcnow()
        previous.ended_by = actor.user_id
        previous.end_reason = note or f"Reassigned to {contractor.company_name}"
        session.flush()

    assignment = ProjectAssignment(
        project_id=project.id, contractor_id=contractor.id, note=note, assigned_by=actor.user_id
    )
    session.add(assignment)
    try:
        session.flush()
    except IntegrityError as exc:
        session.rollback()
        raise ConflictError("The project assignment changed concurrently; retry the request") from exc

    if previous is None:
        action, summary = (
            "project.assigned",
            f"{contractor.company_name} assigned to {project.reference_code}",
        )
    else:
        action = "project.reassigned"
        summary = (
            f"{project.reference_code} reassigned from {previous.contractor.company_name} "
            f"to {contractor.company_name}"
        )
    activity.add(
        session,
        actor_id=actor.user_id,
        action=action,
        entity_type="assignment",
        entity_id=assignment.id,
        project_id=project.id,
        summary=summary,
    )
    session.commit()
    session.refresh(assignment)
    return assignment


def unassign(session: Session, project_id: int, reason: str, actor: Principal) -> ProjectAssignment:
    project = project_service.get_or_404(session, project_id)
    project_service.ensure_open(project, "unassign contractors from")
    current = project.current_assignment
    if current is None:
        raise ConflictError("Project has no assigned contractor")
    if project.status == ProjectStatus.ACTIVE:
        raise InvalidStateError("Pause the project or reassign it before removing the contractor")

    current.ended_at = utcnow()
    current.ended_by = actor.user_id
    current.end_reason = reason
    activity.add(
        session,
        actor_id=actor.user_id,
        action="project.unassigned",
        entity_type="assignment",
        entity_id=current.id,
        project_id=project.id,
        summary=f"{current.contractor.company_name} removed from {project.reference_code}: {reason}",
    )
    session.commit()
    session.refresh(current)
    return current

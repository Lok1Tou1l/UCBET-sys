from collections.abc import Sequence

from sqlalchemy.orm import Session

from ..core.errors import BusinessValidationError, InvalidStateError
from ..core.security import Principal
from ..models import ProgressUpdate, ProjectStatus
from ..repositories import activity
from ..repositories import projects as project_repo
from ..schemas.progress import ProgressCreate
from ..utils.pagination import PageRequest
from . import projects as project_service


def history(session: Session, project_id: int, page: PageRequest) -> tuple[Sequence[ProgressUpdate], int]:
    project_service.get_or_404(session, project_id)
    return project_repo.progress_page(session, project_id, page)


def record(session: Session, project_id: int, data: ProgressCreate, actor: Principal) -> ProgressUpdate:
    project = project_service.get_or_404(session, project_id)
    if project.status != ProjectStatus.ACTIVE:
        raise InvalidStateError(
            f"Progress can only be reported on active projects (current: {project.status})"
        )
    previous = project.progress_percent
    if data.percent < previous and not data.note:
        raise BusinessValidationError(
            "A note is required when lowering the progress percentage",
            details={"current_percent": previous},
        )

    update = ProgressUpdate(
        project_id=project.id,
        percent=data.percent,
        previous_percent=previous,
        phase=data.phase,
        note=data.note,
        reported_by=actor.user_id,
    )
    session.add(update)
    project.progress_percent = data.percent
    if data.phase:
        project.current_phase = data.phase
    session.flush()

    phase = f" ({data.phase})" if data.phase else ""
    activity.add(
        session,
        actor_id=actor.user_id,
        action="project.progress_reported",
        entity_type="progress",
        entity_id=update.id,
        project_id=project.id,
        summary=f"{project.reference_code} progress {previous}% → {data.percent}%{phase}",
    )
    session.commit()
    session.refresh(update)
    return update

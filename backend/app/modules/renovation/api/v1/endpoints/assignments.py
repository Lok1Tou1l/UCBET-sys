from typing import Annotated

from fastapi import APIRouter, Depends, status

from ....core.security import Permission, Principal
from ....schemas.assignment import AssignmentCreate, AssignmentEnd, AssignmentRead
from ....services import assignments as service
from ...deps import DbSession, require

router = APIRouter(prefix="/projects/{project_id}/assignments", tags=["assignments"])


@router.get("", response_model=list[AssignmentRead], summary="Assignment history, newest first")
def list_assignments(
    project_id: int,
    session: DbSession,
    _: Annotated[Principal, Depends(require(Permission.PROJECTS_READ))],
) -> list[AssignmentRead]:
    return service.history(session, project_id)


@router.post(
    "",
    response_model=AssignmentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Assign or reassign a contractor",
    description="If a contractor is already assigned, that assignment is closed and kept in history.",
)
def assign_contractor(
    project_id: int,
    payload: AssignmentCreate,
    session: DbSession,
    principal: Annotated[Principal, Depends(require(Permission.PROJECTS_ASSIGN))],
) -> AssignmentRead:
    return service.assign(session, project_id, payload.contractor_id, payload.note, principal)


@router.post(
    "/current/end",
    response_model=AssignmentRead,
    summary="Remove the current contractor without assigning a new one",
)
def end_current_assignment(
    project_id: int,
    payload: AssignmentEnd,
    session: DbSession,
    principal: Annotated[Principal, Depends(require(Permission.PROJECTS_ASSIGN))],
) -> AssignmentRead:
    return service.unassign(session, project_id, payload.reason, principal)

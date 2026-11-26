from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from ....core.errors import PermissionDeniedError
from ....core.security import Permission, Principal
from ....models import ProjectStatus
from ....repositories.projects import ProjectFilters
from ....schemas.common import Page
from ....schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
    StatusChangeRequest,
    StatusHistoryRead,
)
from ....services import projects as service
from ...deps import DbSession, Pagination, Storage, require

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=Page[ProjectRead], summary="Search and filter renovation projects")
def list_projects(
    session: DbSession,
    page: Pagination,
    _: Annotated[Principal, Depends(require(Permission.PROJECTS_READ))],
    q: Annotated[
        str | None,
        Query(max_length=100, description="Matches title, reference, building, location, description"),
    ] = None,
    status_: Annotated[
        list[ProjectStatus] | None, Query(alias="status", description="Repeat to match several statuses")
    ] = None,
    building: Annotated[str | None, Query(max_length=150)] = None,
    contractor_id: Annotated[int | None, Query(gt=0, description="Currently assigned contractor")] = None,
    unassigned: Annotated[
        bool | None, Query(description="true: no contractor assigned; false: has one")
    ] = None,
    overdue: Annotated[bool | None, Query()] = None,
    deadline_from: Annotated[date | None, Query()] = None,
    deadline_to: Annotated[date | None, Query()] = None,
    sort: Annotated[
        str | None,
        Query(
            description="title, reference_code, building, status, progress_percent, planned_start_date, "
            "planned_end_date, created_at, updated_at; prefix with '-' for descending"
        ),
    ] = None,
) -> Page[ProjectRead]:
    filters = ProjectFilters(
        search=q,
        statuses=tuple(status_ or ()),
        building=building,
        contractor_id=contractor_id,
        unassigned=unassigned,
        overdue=overdue,
        deadline_from=deadline_from,
        deadline_to=deadline_to,
    )
    items, total = service.list_projects(session, filters, page, sort)
    return Page(items=items, total=total, page=page.page, page_size=page.page_size)


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    session: DbSession,
    principal: Annotated[Principal, Depends(require(Permission.PROJECTS_WRITE))],
) -> ProjectRead:
    if payload.contractor_id is not None and not principal.has(Permission.PROJECTS_ASSIGN):
        raise PermissionDeniedError(
            "Assigning a contractor requires an additional permission",
            details={"required_permission": Permission.PROJECTS_ASSIGN.value},
        )
    return service.create(session, payload, principal)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: int,
    session: DbSession,
    _: Annotated[Principal, Depends(require(Permission.PROJECTS_READ))],
) -> ProjectRead:
    return service.get_or_404(session, project_id)


@router.patch("/{project_id}", response_model=ProjectRead, summary="Edit project details (not status)")
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    session: DbSession,
    principal: Annotated[Principal, Depends(require(Permission.PROJECTS_WRITE))],
) -> ProjectRead:
    return service.update(session, project_id, payload, principal)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a planned project with no progress or documents",
)
def delete_project(
    project_id: int,
    session: DbSession,
    storage: Storage,
    principal: Annotated[Principal, Depends(require(Permission.PROJECTS_DELETE))],
) -> Response:
    service.delete(session, project_id, principal, storage)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{project_id}/status",
    response_model=ProjectRead,
    summary="Change project status",
    description="Allowed: planned→active|cancelled, active→paused|completed|cancelled, "
    "paused→active|cancelled. Pausing/cancelling needs a reason, activating needs an assigned "
    "contractor, completing needs 100% progress.",
)
def change_status(
    project_id: int,
    payload: StatusChangeRequest,
    session: DbSession,
    principal: Annotated[Principal, Depends(require(Permission.PROJECTS_STATUS))],
) -> ProjectRead:
    return service.change_status(session, project_id, payload.status, payload.reason, principal)


@router.get("/{project_id}/status-history", response_model=list[StatusHistoryRead])
def status_history(
    project_id: int,
    session: DbSession,
    _: Annotated[Principal, Depends(require(Permission.PROJECTS_READ))],
) -> list[StatusHistoryRead]:
    return service.status_history(session, project_id)
